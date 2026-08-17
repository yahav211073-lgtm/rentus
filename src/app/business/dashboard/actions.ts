"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveImageField } from "@/lib/uploads";

/**
 * עדכון פרטי עסק מהדשבורד של הבעלים. משתמשים בלקוח המחובר לסשן
 * (לא ה-admin client) בכוונה — כך ש-RLS וה-GRANT העמודתי מ-0009_rls.sql
 * הם קו ההגנה האמיתי: גם אם מישהו ישלח שדה status דרך devtools,
 * הבסיס נתונים פשוט יתעלם ממנו (העמודה לא ב-GRANT של authenticated).
 *
 * אותו עיקרון חל על תמונות, שעות ושירותים למטה: כולם כותבים דרך
 * לקוח הסשן, ולא ה-admin client — RLS על business_hours/business_services
 * (0009_rls.sql, owns_business()) הוא שמונע מבעל עסק לגעת בעסק שאינו שלו.
 */
export async function updateBusiness(businessId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "החיבור למסד הנתונים לא הוגדר." };

  const field = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const cover = await resolveImageField(formData, {
    fileKey: "cover", urlKey: "__none__", clearKey: "coverClear", folder: `owner/${businessId}`,
  });
  if (!cover.ok) return { ok: false, error: cover.error };

  const logo = await resolveImageField(formData, {
    fileKey: "logo", urlKey: "__none__", clearKey: "logoClear", folder: `owner/${businessId}`,
  });
  if (!logo.ok) return { ok: false, error: logo.error };

  const update: Record<string, unknown> = {
    name: field("name"),
    tagline: field("tagline"),
    description: field("description"),
    address: field("address"),
    phone: field("phone"),
    whatsapp: field("whatsapp"),
    email: field("email"),
    website: field("website"),
  };
  // undefined = לא נגעו בשדה התמונה; שומרים על הערך הקיים.
  if (cover.url !== undefined) update.cover_url = cover.url;
  if (logo.url !== undefined) update.logo_url = logo.url;

  const { error } = await supabase
    .from("businesses")
    .update(update)
    .eq("id", businessId);

  if (error) return { ok: false, error: "השמירה נכשלה. נסו שוב." };

  revalidatePath("/business/dashboard");
  return { ok: true };
}

/**
 * שעות פעילות. מחיקה-והוספה-מחדש של כל השבוע בכל שמירה — פשוט
 * ונכון: העריכה כאן היא שורה אחת ליום (בלי טווחים כפולים), בדיוק
 * כמו שהתצוגה ב-OpeningHours.tsx מניחה ומציגה בפועל.
 */
export async function updateBusinessHours(
  businessId: string,
  days: { dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null }[],
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "החיבור למסד הנתונים לא הוגדר." };

  const { error: delErr } = await supabase.from("business_hours").delete().eq("business_id", businessId);
  if (delErr) return { ok: false, error: "השמירה נכשלה. נסו שוב." };

  const rows = days
    .filter((d) => d.isClosed || (d.opensAt && d.closesAt))
    .map((d) => ({
      business_id: businessId,
      day_of_week: d.dayOfWeek,
      is_closed: d.isClosed,
      opens_at: d.isClosed ? null : d.opensAt,
      closes_at: d.isClosed ? null : d.closesAt,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("business_hours").insert(rows);
    if (error) return { ok: false, error: "השמירה נכשלה. נסו שוב." };
  }

  revalidatePath("/business/dashboard");
  return { ok: true };
}

/**
 * שירותים ומחירון — אותה גישת מחיקה-והוספה-מחדש, מהסיבה שהעריכה
 * היא תמיד "כל הרשימה בבת אחת" מהטופס, לא עדכון שורה בודדת.
 */
export async function updateBusinessServices(
  businessId: string,
  services: { name: string; description: string | null; price: number | null; priceUnit: string | null }[],
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "החיבור למסד הנתונים לא הוגדר." };

  const { error: delErr } = await supabase.from("business_services").delete().eq("business_id", businessId);
  if (delErr) return { ok: false, error: "השמירה נכשלה. נסו שוב." };

  const rows = services
    .filter((s) => s.name.trim())
    .map((s, i) => ({
      business_id: businessId,
      name: s.name.trim(),
      description: s.description?.trim() || null,
      price: s.price,
      price_unit: s.priceUnit?.trim() || null,
      sort_order: i,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("business_services").insert(rows);
    if (error) return { ok: false, error: "השמירה נכשלה. נסו שוב." };
  }

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
