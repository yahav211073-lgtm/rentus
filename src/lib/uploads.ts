import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]);
const BUCKET = "business-images";

export const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/avif";
export const MAX_IMAGE_MB = 5;

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * כתובת תמונה שדפדפן באמת יכול לטעון.
 *
 * הבדיקה הזו קיימת בגלל תקלה אמיתית: שדות "כתובת תמונה" בניהול קיבלו
 * טקסט חופשי, ולתוכם הודבקו נתיבי `file:///Users/...` מהמחשב. הם
 * נשמרו במסד בהצלחה — ולכן הניהול הציג "נשמר" — אבל אצל כל גולש
 * אחר הם פשוט תמונה שבורה. זה נראה בדיוק כמו כשל סנכרון בין הניהול
 * לאתר, ולכן הבדיקה יושבת בשכבה שכל פעולת ניהול עוברת דרכה.
 *
 * מותר: https://, http://, ונתיב יחסי (/images/x.jpg).
 */
export function sanitizeWebUrl(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** כמו sanitizeWebUrl, אבל מבדיל בין "ריק" ל"לא תקין" — לצורך הודעת שגיאה. */
export function checkWebUrl(raw: unknown): { ok: true; url: string | null } | { ok: false; error: string } {
  const value = String(raw ?? "").trim();
  if (!value) return { ok: true, url: null };
  const clean = sanitizeWebUrl(value);
  if (!clean) {
    return {
      ok: false,
      error: "הכתובת אינה כתובת אינטרנט תקינה. נתיב מהמחשב (file://) לא יוצג לגולשים — העלו את הקובץ במקום.",
    };
  }
  return { ok: true, url: clean };
}

export function hasUpload(file: FormDataEntryValue | null) {
  return file instanceof File && file.size > 0;
}

/**
 * העלאת תמונת ניהול ל־Storage.
 *
 * הקובץ נבדק בצד השרת ולא מסתמכים על ‎accept‎ בדפדפן — הוא רק רמז
 * לבורר הקבצים ולא אכיפה. הבאקט ציבורי בכוונה: אלה נכסי תצוגה
 * שממילא מוגשים לכל גולש.
 */
export async function uploadPublicImage(
  file: FormDataEntryValue | null,
  folder: string,
): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "יש לבחור קובץ תמונה." };
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "אפשר להעלות JPG, PNG, WebP או AVIF בלבד." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `גודל התמונה המירבי הוא ${MAX_IMAGE_MB}MB.` };
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${folder}/${randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "שירות ההעלאות אינו מוגדר." };

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });

  if (error) return { ok: false, error: "העלאת התמונה נכשלה. נסו שוב." };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/**
 * פותר שדה תמונה של טופס ניהול למקור אמת אחד.
 *
 * סדר העדיפויות מכוון: קובץ שהועלה גובר על כתובת שהוקלדה, וכתובת
 * שהוקלדה נבדקת. הפונקציה מחזירה `undefined` כשאין שינוי — כך
 * שקריאת עדכון יכולה פשוט לא לכתוב את השדה ולא לדרוס תמונה קיימת
 * במשתמש שלא נגע בשדה בכלל.
 */
export async function resolveImageField(
  formData: FormData,
  opts: { fileKey?: string; urlKey?: string; clearKey?: string; folder: string },
): Promise<{ ok: true; url: string | null | undefined } | { ok: false; error: string }> {
  const { fileKey = "image", urlKey = "imageUrl", clearKey = "imageClear", folder } = opts;

  if (formData.get(clearKey) === "1") return { ok: true, url: null };

  const file = formData.get(fileKey);
  if (hasUpload(file)) {
    const upload = await uploadPublicImage(file, folder);
    return upload.ok ? { ok: true, url: upload.url } : { ok: false, error: upload.error };
  }

  if (formData.has(urlKey)) {
    const checked = checkWebUrl(formData.get(urlKey));
    if (!checked.ok) return checked;
    return { ok: true, url: checked.url };
  }

  return { ok: true, url: undefined };
}
