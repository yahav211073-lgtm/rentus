"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/uploads";
import { slugify } from "@/lib/utils";
import { missingVerificationFields } from "@/lib/verification";

/**
 * כל הפעולות כאן משתמשות ב-admin client (service role) בכוונה —
 * status/tier/is_featured/boost_score נעולים ל-authenticated ברמת
 * העמודה (0009_rls.sql), וזה כולל אדמינים: profiles.role='admin'
 * לא הופך את חיבור ה-DB לתפקיד Postgres שונה. requireStaff() הוא
 * קו ההגנה בפועל כאן, ולכן הוא הדבר הראשון בכל פעולה.
 */

/** פענוח שדה השעות מהטופס. קלט לא תקין מוחזר כרשימה ריקה ולא מפיל
    את היצירה — עסק בלי שעות עדיף על טופס שנכשל. */
function parseHours(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (h) => typeof h?.dayOfWeek === "number" && typeof h?.isClosed === "boolean",
    ) as { dayOfWeek: number; isClosed: boolean; opensAt: string; closesAt: string }[];
  } catch {
    return [];
  }
}

/** רענון כל מה שמושפע משינוי סטטוס של עסק — כולל העמוד הציבורי שלו. */
function refreshBusiness(slug?: string | null) {
  revalidatePath("/admin/businesses");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/business/dashboard");
  if (slug) revalidatePath(`/business/${slug}`);
}

/**
 * התראה לבעל העסק על החלטת המנהל.
 *
 * זו החוליה שסוגרת את הזרימה: בלעדיה בעל העסק היה צריך לנחש אם
 * הבקשה אושרה. נכתבת ב-admin client כי היא נוצרת עבור משתמש אחר,
 * וכישלון שלה לא מבטל את האישור עצמו.
 */
async function notifyOwner(
  businessId: string,
  payload: { title: string; body: string; link: string; type: string },
) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const { data } = await supabase
    .from("businesses").select("owner_id").eq("id", businessId).maybeSingle();

  if (!data?.owner_id) return;

  await supabase.from("notifications").insert({
    user_id: data.owner_id,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link,
  });
}

export async function approveBusiness(businessId: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data, error } = await supabase
    .from("businesses")
    .update({ status: "published", rejection_reason: null })
    .eq("id", businessId)
    .select("slug, name")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  await notifyOwner(businessId, {
    type: "business.approved",
    title: "העסק שלכם אושר ופורסם",
    body: `${data?.name ?? "העסק"} מופיע עכשיו באתר ויכול לקבל פניות.`,
    link: data?.slug ? `/business/${data.slug}` : "/business/dashboard",
  });

  refreshBusiness(data?.slug);
  return { ok: true };
}

export async function rejectBusiness(businessId: string, reason: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data, error } = await supabase
    .from("businesses")
    .update({ status: "rejected", rejection_reason: reason.trim() || null })
    .eq("id", businessId)
    .select("slug, name")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  await notifyOwner(businessId, {
    type: "business.rejected",
    title: "הבקשה לא אושרה",
    body: reason.trim()
      ? `${data?.name ?? "העסק"}: ${reason.trim()}`
      : `${data?.name ?? "העסק"} לא אושר לפרסום. ניתן לתקן את הפרטים ולהגיש שוב.`,
    link: "/business/dashboard",
  });

  refreshBusiness(data?.slug);
  return { ok: true };
}

export async function setBusinessArchived(businessId: string, archived: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data, error } = await supabase
    .from("businesses")
    .update({ status: archived ? "archived" : "published" })
    .eq("id", businessId)
    .select("slug")
    .maybeSingle();

  refreshBusiness(data?.slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export interface BusinessAdminUpdate {
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  status: string;
  tier: string;
  isFeatured: boolean;
  isSponsored: boolean;
  isVerified: boolean;
  boostScore: number;
  categoryId: string | null;
  cityId: string | null;
  social: Record<string, string>;
}

export async function updateBusinessAdmin(businessId: string, update: BusinessAdminUpdate) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  // רשתות ריקות לא נשמרות בכלל — כך עמוד העסק לא צריך לסנן אותן,
  // והוא לעולם לא מציג כפתור רשת שמוביל לשום מקום.
  const social = Object.fromEntries(
    Object.entries(update.social).filter(([, v]) => v.trim().length > 0),
  );

  const { data, error } = await supabase
    .from("businesses")
    .update({
      name: update.name,
      tagline: update.tagline,
      description: update.description,
      address: update.address,
      latitude: update.latitude,
      longitude: update.longitude,
      phone: update.phone,
      whatsapp: update.whatsapp,
      email: update.email,
      website: update.website,
      city_id: update.cityId,
      social,
      status: update.status,
      tier: update.tier,
      is_featured: update.isFeatured,
      is_sponsored: update.isSponsored,
      is_verified: update.isVerified,
      boost_score: update.boostScore,
    })
    .eq("id", businessId)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  if (update.categoryId) {
    // מוודאים שיש בדיוק שיוך קטגוריה-ראשית אחד: מוחקים ומכניסים מחדש
    // במקום upsert, כי אין מפתח ייחודי יציב שמזהה "השורה הראשית הישנה".
    await supabase.from("business_categories").delete().eq("business_id", businessId).eq("is_primary", true);
    await supabase.from("business_categories").insert({
      business_id: businessId, category_id: update.categoryId, is_primary: true,
    });
  }

  refreshBusiness(data?.slug);
  revalidatePath(`/admin/businesses/${businessId}`);
  return { ok: true };
}

/**
 * הוספת עסק ישירות מהניהול — הזרימה שבה מנהל מדבר עם לקוח בטלפון
 * ובונה לו את הפרופיל בעצמו, בלי שהלקוח יעבור דרך הרשמה. נוצר כבר
 * "פורסם" ובלי owner_id; כשבעל העסק יפתח חשבון, מקשרים אותו ידנית.
 */
export async function createBusinessAdmin(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "שם העסק הוא שדה חובה." };

  /* לוגו הוא שדה חובה ביצירת עסק. אין יותר אווטאר-אות כגיבוי
     בכרטיסים, ולכן עסק בלי לוגו היה מופיע ברשת עם חור במקום
     הסמל — מצב שנראה כתקלה ולא כפרופיל חלקי. */
  const logo = await uploadPublicImage(formData.get("logo"), "admin");
  if (!logo.ok) return { ok: false, error: `לוגו: ${logo.error}` };

  /* תמונת הרקע נשארת אופציונלית — עמוד העסק יודע להציג רקע גנרי,
     ובניגוד ללוגו היא לא מזהה את העסק. */
  const cover = await uploadPublicImage(formData.get("cover"), "admin");

  const slug = `${slugify(name) || "business"}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      slug,
      name,
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      city_id: String(formData.get("cityId") ?? "") || null,
      status: "published",
      /* עסק שנוסף ידנית מהניהול הוא בהגדרה עסק שמישהו מהצוות
         אימת בטלפון, ולכן הוא נוצר כמאומת גם בלי שלב אישור נוסף.
         שים לב: זה **לא** דורש owner_id. עסק שנוסף מהניהול נשאר
         בלי חשבון בעלים, וזה מצב תקין ומכוון. */
      is_verified: true,
      logo_url: logo.url,
      cover_url: cover.ok ? cover.url : null,
    })
    .select("id, slug")
    .single();

  if (error || !business) return { ok: false, error: error?.message ?? "השמירה נכשלה." };

  const categoryId = String(formData.get("categoryId") ?? "");
  if (categoryId) {
    await supabase.from("business_categories").insert({
      business_id: business.id, category_id: categoryId, is_primary: true,
    });
  }

  /* שעות פעילות. נכתבות רק כשסומן יום פתוח אחד לפחות — שבוע שכולו
     "סגור" הוא "לא מילאתי", וכתיבתו הייתה גורמת לדף העסק להציג
     טבלה שאומרת שהעסק סגור תמיד. */
  const hours = parseHours(formData.get("hours"));
  if (hours.some((h) => !h.isClosed)) {
    await supabase.from("business_hours").insert(
      hours.map((h) => ({
        business_id: business.id,
        day_of_week: h.dayOfWeek,
        is_closed: h.isClosed,
        opens_at: h.isClosed ? null : h.opensAt,
        closes_at: h.isClosed ? null : h.closesAt,
      })),
    );
  }

  refreshBusiness(business.slug as string);
  return { ok: true, businessId: business.id as string };
}

/**
 * הוספה/הסרה של עסק מ"חברות מומלצות" בעמוד הבית.
 *
 * פעולה נפרדת ולא עוד שדה בטופס העריכה: קידום הוא החלטה שמשנים
 * לעיתים קרובות ומתוך הרשימה — לא משהו שפותחים בשבילו עמוד עריכה
 * מלא. is_featured נעול ל-authenticated ברמת העמודה, ולכן גם כאן
 * admin client אחרי requireStaff().
 */
export async function setBusinessFeatured(businessId: string, featured: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data, error } = await supabase
    .from("businesses")
    .update({ is_featured: featured })
    .eq("id", businessId)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  refreshBusiness(data?.slug);
  return { ok: true };
}

/**
 * סימון עסק כמאומת.
 *
 * "מאומת" באתר הזה פירושו שהפרטים המהותיים הוזנו ונבדקו ידנית —
 * לוגו, טלפון, כתובת, שעות פעילות ואזורי שירות. לכן הפעולה מסרבת
 * לסמן עסק שחסר לו אחד מהם, ומחזירה בדיוק מה חסר: תג אמון שאפשר
 * להדביק על פרופיל ריק הוא תג חסר ערך.
 */
export async function setBusinessVerified(businessId: string, verified: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  if (verified) {
    const { data: b } = await supabase
      .from("businesses")
      .select("logo_url, phone, address, city_id, business_hours(day_of_week), business_service_areas(area_id)")
      .eq("id", businessId)
      .maybeSingle();

    const missing = missingVerificationFields(b);
    if (missing.length > 0) {
      return { ok: false, error: `חסר כדי לאמת: ${missing.join(", ")}` };
    }
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({ is_verified: verified })
    .eq("id", businessId)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  refreshBusiness(data?.slug);
  return { ok: true };
}

/**
 * עדכון הלוגו של עסק מהניהול.
 *
 * פעולה נפרדת מ-updateBusinessAdmin כי היא מקבלת FormData עם קובץ,
 * בעוד שאר הטופס נוסע כאובייקט. איחוד השניים היה מכריח את כל
 * הטופס לעבור ל-FormData בשביל שדה אחד.
 */
export async function updateBusinessLogo(businessId: string, formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const logo = await uploadPublicImage(formData.get("logo"), "admin");
  if (!logo.ok) return { ok: false, error: logo.error };

  const { data, error } = await supabase
    .from("businesses")
    .update({ logo_url: logo.url })
    .eq("id", businessId)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  refreshBusiness(data?.slug);
  revalidatePath(`/admin/businesses/${businessId}`);
  return { ok: true };
}

/**
 * מחיקה מוחלטת של עסק.
 *
 * נפרד לחלוטין מ-setBusinessArchived: ארכיון מסתיר, מחיקה מוחקת.
 * שתיהן קיימות בכוונה — רוב המקרים הם "להוריד מהאתר" וארכיון הוא
 * התשובה הנכונה להם, אבל אין דרך לנקות רשומת בדיקה או כפילות בלי
 * מחיקה אמיתית.
 *
 * מה נמחק יחד עם העסק: כל הטבלאות התלויות שמוגדרות
 * `on delete cascade` — קטגוריות, שעות, שירותים, מדיה, לידים
 * וביקורות. זה בלתי הפיך, ולכן הכפתור בממשק דורש הקלדת שם העסק.
 *
 * `is_admin` ולא `requireStaff`: מחיקה בלתי הפיכה של נכס מסחרי —
 * כולל הלידים שנצברו לו — היא לא פעולה שעורך תוכן צריך להחזיק.
 * זו אותה הפרדה שחסרה ב-deleteUserAccount ותוקנה שם.
 */
export async function deleteBusinessAdmin(businessId: string, confirmName: string) {
  const me = await requireStaff();
  if (me.role !== "admin") {
    return { ok: false as const, error: "מחיקת עסק שמורה למנהל ראשי בלבד." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false as const, error: "אין חיבור למסד הנתונים." };

  const { data: business } = await supabase
    .from("businesses")
    .select("name, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return { ok: false as const, error: "העסק לא נמצא." };

  /* אישור בשם ולא ב-confirm() של הדפדפן: דיאלוג "בטוח?" נלחץ
     אוטומטית, הקלדת שם דורשת לקרוא מה מוחקים. */
  if (confirmName.trim() !== business.name.trim()) {
    return { ok: false as const, error: "השם שהוקלד אינו תואם לשם העסק." };
  }

  const { error } = await supabase.from("businesses").delete().eq("id", businessId);
  if (error) return { ok: false as const, error: error.message };

  refreshBusiness(business.slug as string);
  return { ok: true as const };
}
