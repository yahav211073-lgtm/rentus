"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/uploads";
import { slugify } from "@/lib/utils";

/**
 * כל הפעולות כאן משתמשות ב-admin client (service role) בכוונה —
 * status/tier/is_featured/boost_score נעולים ל-authenticated ברמת
 * העמודה (0009_rls.sql), וזה כולל אדמינים: profiles.role='admin'
 * לא הופך את חיבור ה-DB לתפקיד Postgres שונה. requireStaff() הוא
 * קו ההגנה בפועל כאן, ולכן הוא הדבר הראשון בכל פעולה.
 */

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

  const cover = await uploadPublicImage(formData.get("cover"), "admin");
  if (!cover.ok) return { ok: false, error: cover.error };

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
      is_verified: true,
      cover_url: cover.url,
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

  refreshBusiness(business.slug as string);
  return { ok: true, businessId: business.id as string };
}
