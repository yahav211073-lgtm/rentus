"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function moderateReview(reviewId: string, status: "approved" | "rejected") {
  const staff = await requireStaff();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase!
    .from("reviews")
    .update({ status, moderated_by: staff.id, moderated_at: new Date().toISOString() })
    .eq("id", reviewId);

  revalidatePath("/admin/reviews");
  return error ? { ok: false, error: error.message } : { ok: true };
}
