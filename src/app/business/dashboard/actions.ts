"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * עדכון פרטי עסק מהדשבורד של הבעלים. משתמשים בלקוח המחובר לסשן
 * (לא ה-admin client) בכוונה — כך ש-RLS וה-GRANT העמודתי מ-0009_rls.sql
 * הם קו ההגנה האמיתי: גם אם מישהו ישלח שדה status דרך devtools,
 * הבסיס נתונים פשוט יתעלם ממנו (העמודה לא ב-GRANT של authenticated).
 */
export async function updateBusiness(businessId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "החיבור למסד הנתונים לא הוגדר." };

  const field = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const { error } = await supabase
    .from("businesses")
    .update({
      name: field("name"),
      tagline: field("tagline"),
      description: field("description"),
      address: field("address"),
      phone: field("phone"),
      whatsapp: field("whatsapp"),
      email: field("email"),
      website: field("website"),
    })
    .eq("id", businessId);

  if (error) return { ok: false, error: "השמירה נכשלה. נסו שוב." };

  revalidatePath("/business/dashboard");
  return { ok: true };
}

/**
 * סימון התראות כנקראו.
 *
 * גם כאן לקוח הסשן ולא ה-admin client: מדיניות notifications_own
 * מאפשרת עדכון רק לשורות של המשתמש עצמו, ולכן רשימת מזהים שהגיעה
 * מהדפדפן לא יכולה לגעת בהתראות של מישהו אחר גם אם תזויף.
 */
export async function markNotificationsRead(ids: string[]) {
  if (ids.length === 0) return { ok: true };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "החיבור למסד הנתונים לא הוגדר." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .is("read_at", null);

  revalidatePath("/business/dashboard");
  return error ? { ok: false, error: error.message } : { ok: true };
}
