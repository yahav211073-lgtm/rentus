"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/** עדכון גנרי לשורת settings אחת לפי key — כל טופסי ההגדרות משתמשים בזה. */
export async function updateSetting(key: string, value: Record<string, unknown>) {
  const user = await requireStaff();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase!
    .from("settings")
    .update({ value, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("key", key);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return error ? { ok: false, error: error.message } : { ok: true };
}
