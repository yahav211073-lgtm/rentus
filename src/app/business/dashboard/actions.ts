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
