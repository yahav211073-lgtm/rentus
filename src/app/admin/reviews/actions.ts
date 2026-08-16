"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * מודרציית ביקורות על עסקים.
 *
 * אישור ביקורת חייב לרענן גם את עמוד העסק הציבורי ולא רק את מסך
 * הניהול — אחרת המנהל רואה "אושר" ובאתר לא קרה כלום, וזו בדיוק
 * תחושת חוסר הסנכרון. revalidatePath על נתיב העסק הספציפי הוא מה
 * שסוגר את הלולאה.
 */
export async function moderateReview(reviewId: string, status: "approved" | "rejected" | "pending") {
  const staff = await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data, error } = await supabase
    .from("reviews")
    .update({
      status,
      moderated_by: staff.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select("business:businesses(slug)")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  const slug = (data?.business as unknown as { slug: string } | null)?.slug;
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/business/${slug}`);
  return { ok: true };
}

export async function deleteReview(reviewId: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data } = await supabase
    .from("reviews").select("business:businesses(slug)").eq("id", reviewId).maybeSingle();

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  const slug = (data?.business as unknown as { slug: string } | null)?.slug;
  revalidatePath("/admin/reviews");
  if (slug) revalidatePath(`/business/${slug}`);
  return { ok: true };
}
