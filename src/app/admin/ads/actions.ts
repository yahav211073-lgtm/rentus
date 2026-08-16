"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkWebUrl, resolveImageField } from "@/lib/uploads";

/**
 * ניהול פרסום.
 *
 * שתי החלטות שנובעות ישירות מתקלה אמיתית שהייתה כאן:
 *
 * 1. תמונת הבאנר מועלית מהמכשיר. השדה הקודם קיבל כתובת כטקסט חופשי,
 *    ולתוכו הודבקו נתיבי `file:///` — שנשמרו במסד בהצלחה, הופיעו
 *    ברשימת הבאנרים כאילו הכל תקין, ובאתר היו תמונה שבורה.
 *
 * 2. באנר בלי תמונה לא יכול להיות פעיל. אכיפה בשמירה, לא רק בתצוגה:
 *    "פעיל" שאין לו מה להציג הוא מצב שמבלבל את מי שמנהל אותו.
 */
function refreshAdViews() {
  revalidatePath("/admin/ads");
  revalidatePath("/", "layout");
}

export async function createBanner(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const title = String(formData.get("title") ?? "").trim();
  const placementKey = String(formData.get("placementKey") ?? "").trim();
  if (!title) return { ok: false, error: "שם פנימי הוא שדה חובה." };
  if (!placementKey) return { ok: false, error: "יש לבחור מיקום." };

  const image = await resolveImageField(formData, {
    fileKey: "image", urlKey: "__none__", folder: "banners",
  });
  if (!image.ok) return { ok: false, error: image.error };
  if (!image.url) return { ok: false, error: "יש להעלות תמונת באנר." };

  const href = checkWebUrl(formData.get("href"));
  if (!href.ok) return { ok: false, error: href.error };

  const { error } = await supabase.from("banners").insert({
    title,
    placement_key: placementKey,
    asset_url: image.url,
    alt: String(formData.get("alt") ?? "").trim() || title,
    href: href.url,
    weight: clampInt(formData.get("weight"), 1, 100, 1),
    priority: clampInt(formData.get("priority"), 0, 100, 0),
    is_active: formData.get("isActive") === "on",
  });

  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateBanner(id: string, formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const image = await resolveImageField(formData, {
    fileKey: "image", urlKey: "__none__", clearKey: "imageClear", folder: "banners",
  });
  if (!image.ok) return { ok: false, error: image.error };

  const href = checkWebUrl(formData.get("href"));
  if (!href.ok) return { ok: false, error: href.error };

  const patch: Record<string, unknown> = {
    title: String(formData.get("title") ?? "").trim(),
    placement_key: String(formData.get("placementKey") ?? "").trim(),
    alt: String(formData.get("alt") ?? "").trim() || String(formData.get("title") ?? ""),
    href: href.url,
    weight: clampInt(formData.get("weight"), 1, 100, 1),
    priority: clampInt(formData.get("priority"), 0, 100, 0),
    is_active: formData.get("isActive") === "on",
  };

  if (image.url !== undefined) patch.asset_url = image.url;
  // באנר שנשארה לו תמונה ריקה לא יכול להיות פעיל
  if (patch.asset_url === null) patch.is_active = false;

  const { error } = await supabase.from("banners").update(patch).eq("id", id);

  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function toggleBannerActive(id: string, isActive: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  if (isActive) {
    const { data } = await supabase.from("banners").select("asset_url").eq("id", id).maybeSingle();
    if (!data?.asset_url) {
      return { ok: false, error: "אי אפשר להפעיל באנר בלי תמונה. העלו תמונה קודם." };
    }
  }

  const { error } = await supabase.from("banners").update({ is_active: isActive }).eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteBanner(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase.from("banners").delete().eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function createPopup(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "שם פנימי הוא שדה חובה." };

  const image = await resolveImageField(formData, {
    fileKey: "image", urlKey: "__none__", folder: "popups",
  });
  if (!image.ok) return { ok: false, error: image.error };

  const ctaHref = checkWebUrl(formData.get("ctaHref"));
  if (!ctaHref.ok) return { ok: false, error: ctaHref.error };

  const { error } = await supabase.from("popup_banners").insert({
    title,
    heading: String(formData.get("heading") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    asset_url: image.url ?? null,
    alt: title,
    cta_label: String(formData.get("ctaLabel") ?? "").trim() || null,
    cta_href: ctaHref.url,
    trigger_type: String(formData.get("triggerType") ?? "delay"),
    trigger_delay_sec: clampInt(formData.get("triggerDelaySec"), 0, 120, 5),
    is_active: formData.get("isActive") === "on",
  });

  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function togglePopupActive(id: string, isActive: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase.from("popup_banners").update({ is_active: isActive }).eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deletePopup(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase.from("popup_banners").delete().eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** ערך מספרי מטופס הוא מחרוזת חופשית. עמודות ה-DB תחומות, אז חוסמים כאן. */
function clampInt(raw: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
