"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/uploads";
import { slugify } from "@/lib/utils";

/**
 * בקשה להוספת עסק.
 *
 * הזרימה שהוגדרה: בעל עסק פותח חשבון → מגיש בקשה → הבקשה נכנסת
 * לניהול → מנהל מאשר או דוחה → בעל העסק מקבל התראה באתר.
 *
 * הבקשה היא שורת `businesses` עם status='pending' ולא טבלה נפרדת.
 * זה מכוון: טבלת "בקשות" נפרדת הייתה מחייבת להעתיק את כל השדות
 * פעמיים ולתחזק שני מסלולי יצירה — בדיוק הכפילות שגורמת לנתונים
 * להתפצל ולניהול להציג משהו אחר מהאתר.
 *
 * הכתיבה עוברת דרך לקוח הסשן ולא ה-admin client, כדי ש-RLS
 * (businesses_insert_own ב-0011) יאכוף שהעסק נרשם על שם המגיש
 * ובסטטוס ממתין בלבד. גם אם הקוד כאן ישתנה, אי אפשר יהיה להגיש
 * עסק שנוצר ישר כ"מפורסם".
 */
export async function submitBusinessRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "צריך להתחבר כדי להגיש בקשה." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "אין חיבור למסד הנתונים." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, error: "שם העסק הוא שדה חובה." };

  const categoryId = String(formData.get("category") ?? "");
  if (!categoryId) return { ok: false as const, error: "יש לבחור קטגוריה." };

  const phone = String(formData.get("phone") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  if (!phone && !whatsapp) {
    return { ok: false as const, error: "צריך טלפון או וואטסאפ כדי שנוכל לחזור אליכם." };
  }

  const cover = await uploadPublicImage(formData.get("cover"), `owner/${user.id}`);
  if (!cover.ok) return { ok: false as const, error: cover.error };

  const slug = `${slugify(name) || "business"}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      slug,
      name,
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      status: "pending",
      city_id: String(formData.get("city") ?? "") || null,
      address: String(formData.get("address") ?? "").trim() || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: String(formData.get("email") ?? "").trim() || null,
      cover_url: cover.url,
    })
    .select("id")
    .single();

  if (error || !business) {
    return { ok: false as const, error: "שמירת הבקשה נכשלה. נסו שוב או פנו אלינו בוואטסאפ." };
  }

  // שיוך הקטגוריה נכשל לעיתים על RLS של טבלת הקישור. עסק בלי
  // קטגוריה שאפשר לתקן בניהול עדיף על אובדן כל הטופס, ולכן הכישלון
  // כאן לא מבטל את ההגשה.
  await supabase
    .from("business_categories")
    .insert({ business_id: business.id, category_id: categoryId, is_primary: true });

  // התראה לצוות. admin client כי היא נכתבת עבור משתמש אחר.
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data: staff } = await admin
      .from("profiles").select("id").in("role", ["admin", "moderator"]);

    if (staff?.length) {
      await admin.from("notifications").insert(
        staff.map((s) => ({
          user_id: s.id,
          type: "business.requested",
          title: "בקשה חדשה להוספת עסק",
          body: `${name} ממתין לאישור.`,
          link: `/admin/businesses/${business.id}`,
        })),
      );
    }
  }

  revalidatePath("/admin/businesses");
  revalidatePath("/admin");
  revalidatePath("/business/dashboard");
  return { ok: true as const };
}
