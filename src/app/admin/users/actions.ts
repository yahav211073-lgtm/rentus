"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

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

/**
 * מחיקת חשבון. עוברת דרך ה-admin client כי מחיקת שורה מ-auth.users
 * זמינה רק ל-Auth Admin API (service_role) — לא לקוח סשן רגיל.
 * profiles נמחקת אוטומטית בעקבותיה (FK עם on delete cascade).
 */
export async function deleteUserAccount(userId: string) {
  const me = await requireStaff();
  if (userId === me.id) return { ok: false, error: "אי אפשר למחוק את החשבון שאיתו אתם מחוברים." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.auth.admin.deleteUser(userId);

  revalidatePath("/admin/users");
  return error ? { ok: false, error: error.message } : { ok: true };
}
