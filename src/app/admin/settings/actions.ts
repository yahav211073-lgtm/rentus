"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkWebUrl, resolveImageField } from "@/lib/uploads";

/**
 * הגדרות האתר.
 *
 * שורת settings אחת לכל תחום. הערך נשמר כ-JSON, ונקרא בצד הציבורי
 * דרך lib/repo/branding.ts ו-lib/repo/settings.ts — אין ערך קשיח
 * בקוד שדורס אותו, ולכן שינוי כאן משתקף באתר מיד.
 *
 * revalidatePath("/", "layout") הוא הפרט הקריטי: שם המותג, הלוגו
 * והצבעים יושבים ב-layout השורשי, ורענון של עמוד בודד לא היה מרענן
 * אותם.
 */
function refresh() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

async function write(key: string, value: Record<string, unknown>) {
  const user = await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false as const, error: "אין חיבור למסד הנתונים." };

  // upsert ולא update: מפתח שלא נוצר ב-seed היה נכשל בשקט בעדכון,
  // והמנהל היה רואה "נשמר" בלי שנשמר כלום.
  const { error } = await supabase
    .from("settings")
    .upsert(
      { key, value, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );

  refresh();
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

/** עדכון גנרי לשורת settings אחת לפי key. */
export async function updateSetting(key: string, value: Record<string, unknown>) {
  return write(key, value);
}

/**
 * זהות המותג. הלוגו מועלה מהמכשיר ולא מוקלד ככתובת — השדה הקודם
 * קיבל טקסט חופשי, ולתוכו הודבק נתיב `file:///` מהמחשב שנשמר תקין
 * במסד אבל היה תמונה שבורה בכל דפדפן אחר.
 */
export async function updateBrandIdentity(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };
  await requireStaff();

  const logo = await resolveImageField(formData, {
    fileKey: "logo", urlKey: "__none__", clearKey: "logoClear", folder: "brand",
  });
  if (!logo.ok) return { ok: false, error: logo.error };

  const { data: current } = await supabase
    .from("settings").select("value").eq("key", "brand.identity").maybeSingle();
  const existing = (current?.value ?? {}) as Record<string, unknown>;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "שם האתר הוא שדה חובה." };

  return write("brand.identity", {
    ...existing,
    name,
    tagline: String(formData.get("tagline") ?? "").trim(),
    // undefined = לא נגעו בשדה התמונה; שומרים על הלוגו הקיים.
    logoUrl: logo.url === undefined ? (existing.logoUrl ?? null) : logo.url,
  });
}

/**
 * קישורי רשתות. כתובת שאינה http(s) נדחית עם הסבר במקום להישמר
 * ולהפוך לקישור שבור בפוטר.
 */
export async function updateSocialLinks(formData: FormData) {
  await requireStaff();
  const keys = ["facebook", "instagram", "linkedin", "tiktok", "youtube"];
  const value: Record<string, string> = {};

  for (const key of keys) {
    const checked = checkWebUrl(formData.get(key));
    if (!checked.ok) return { ok: false, error: `${key}: ${checked.error}` };
    value[key] = checked.url ?? "";
  }

  return write("social.links", value);
}
