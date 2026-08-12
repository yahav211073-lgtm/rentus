"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * שינוי תפקיד — בכוונה עם הלקוח המחובר לסשן, לא ה-admin client.
 * יש טריגר לא-מתועד (ראו הערה בסשן) שבודק is_admin() על ה-DB session
 * עצמו: service_role לא מחזיק auth.uid() ולכן נכשל בבדיקה הזו,
 * למרות שהוא עוקף RLS. רק חיבור אמיתי של אדמין מחובר עובר את הטריגר.
 */
export async function updateUserRole(userId: string, role: string) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase!.from("profiles").update({ role }).eq("id", userId);

  revalidatePath("/admin/users");
  return error ? { ok: false, error: error.message } : { ok: true };
}
