import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface ContactDetails {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
}

const FALLBACK_CONTACT: ContactDetails = { phone: "", email: "", address: "", whatsapp: "972500000000" };

/** settings.contact.details — ציבורי (is_public=true), אותה טבלה שהאדמין יערוך בעתיד. */
export async function getContactDetails(): Promise<ContactDetails> {
  if (!isSupabaseConfigured) return FALLBACK_CONTACT;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return FALLBACK_CONTACT;

  const { data } = await supabase
    .from("settings").select("value").eq("key", "contact.details").maybeSingle();

  if (!data) return FALLBACK_CONTACT;
  const v = data.value as Partial<ContactDetails>;
  return {
    phone: v.phone?.trim() ?? "",
    email: v.email?.trim() ?? "",
    address: v.address?.trim() ?? "",
    // רווח נגרר במספר וואטסאפ שובר את קישור wa.me בשקט
    whatsapp: v.whatsapp?.trim() || FALLBACK_CONTACT.whatsapp,
  };
}

/**
 * קישורי הרשתות החברתיות של האתר.
 *
 * הפוטר מציג רק את מה שחוזר מכאן ובאמת מלא — קודם היו שם שלושה
 * קישורים קבועים עם href="#" שנראו פעילים ולא הובילו לשום מקום.
 */
export async function getSocialLinks(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};

  const supabase = await createSupabaseServerClient();
  if (!supabase) return {};

  const { data } = await supabase
    .from("settings").select("value").eq("key", "social.links").maybeSingle();

  const value = (data?.value ?? {}) as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value)
      .map(([k, v]) => [k, String(v ?? "").trim()])
      .filter(([, v]) => v.length > 0),
  );
}
