import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * העלאת תמונת ניהול ל־Storage. הקובץ נבדק בצד השרת ולא מסתמכים על
 * accept בדפדפן. הבאקֶט הקיים הוא ציבורי בכוונה עבור נכסי תצוגה.
 */
export async function uploadPublicImage(file: FormDataEntryValue | null, folder: string): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "יש לבחור קובץ תמונה." };
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return { ok: false, error: "אפשר להעלות JPG, PNG, WebP או AVIF בלבד." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "גודל התמונה המירבי הוא 5MB." };

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${folder}/${randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "שירות ההעלאות אינו מוגדר." };

  const { error } = await supabase.storage
    .from("business-images")
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });

  if (error) return { ok: false, error: "העלאת התמונה נכשלה. נסו שוב." };
  const { data } = supabase.storage.from("business-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export function hasUpload(file: FormDataEntryValue | null) {
  return file instanceof File && file.size > 0;
}
