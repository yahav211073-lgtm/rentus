"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const ROLES = ["user", "business_owner", "editor", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * שינוי תפקיד.
 *
 * שתי נקודות שקל לפספס:
 *
 * 1. הפעולה רצה עם הלקוח **המחובר לסשן**, לא עם ה-admin client. יש
 *    טריגר על profiles שבודק is_admin() על סשן ה-DB עצמו; service_role
 *    עוקף RLS אבל לא מחזיק auth.uid(), ולכן דווקא הוא נכשל בבדיקה.
 *    רק חיבור אמיתי של מנהל מחובר עובר אותה.
 *
 * 2. הצלחה נבדקת לפי השורה שחזרה, לא לפי היעדר שגיאה. עדכון שלא
 *    תפס אף שורה (בגלל RLS) מחזיר error=null ו-data ריק — כלומר
 *    "הצליח" מבלי שקרה כלום. זו בדיוק הצורה שבה מסך ניהול מציג
 *    אישור על שינוי שלא התרחש.
 */
export async function updateUserRole(userId: string, role: string) {
  const me = await requireStaff();

  if (!ROLES.includes(role as Role)) return { ok: false, error: "תפקיד לא מוכר." };
  if (userId === me.id && role !== me.role) {
    return { ok: false, error: "אי אפשר לשנות את התפקיד של החשבון שאיתו אתם מחוברים." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id, role");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "העדכון נחסם. רק מנהל ראשי יכול לשנות תפקידים." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * מחיקת חשבון. עוברת דרך ה-admin client כי מחיקת שורה מ-auth.users
 * זמינה רק ל-Auth Admin API (service_role) — לא ללקוח סשן רגיל.
 * profiles נמחקת אוטומטית בעקבותיה (FK עם on delete cascade).
 */
export async function deleteUserAccount(userId: string) {
  const me = await requireStaff();
  if (userId === me.id) {
    return { ok: false, error: "אי אפשר למחוק את החשבון שאיתו אתם מחוברים." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "שירות הניהול אינו מוגדר." };

  const { error } = await supabase.auth.admin.deleteUser(userId);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return error ? { ok: false, error: error.message } : { ok: true };
}
