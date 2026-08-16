"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * מודרציית ביקורות על הפלטפורמה.
 *
 * אותה מכונה כמו ביקורות עסקים, ובכוונה — שתי תיבות מודרציה שמתנהגות
 * אחרת זו מזו הן שתי תיבות שיטעו בהן. אישור מרענן את עמוד הבית,
 * כי שם הביקורות מוצגות.
 */
function refresh() {
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function moderateTestimonial(id: string, status: "approved" | "rejected" | "pending") {
  const staff = await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase
    .from("testimonials")
    .update({ status, moderated_by: staff.id, moderated_at: new Date().toISOString() })
    .eq("id", id);

  refresh();
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** הסתרה זמנית בלי לשנות את תוצאת המודרציה. */
export async function toggleTestimonialActive(id: string, isActive: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase.from("testimonials").update({ is_active: isActive }).eq("id", id);
  refresh();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteTestimonial(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  refresh();
  return error ? { ok: false, error: error.message } : { ok: true };
}
