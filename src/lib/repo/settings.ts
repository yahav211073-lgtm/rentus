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

export interface AboutContent {
  intro: string;
  points: { title: string; body: string }[];
}

const FALLBACK_ABOUT: AboutContent = {
  intro: "הוא המקום שבו מוצאים כל מה שצריך להשכיר — מציוד לאירועים ועד כלי עבודה ורכב — דרך עסקים מאומתים בכל הארץ. במקום לחפש בעשרים קבוצות ואתרים שונים, הכל נמצא כאן, במקום אחד.",
  points: [
    { title: "עסקים מאומתים", body: "כל עסק חדש עובר בדיקה ואישור ידני לפני שהוא מתפרסם — לא כל מי שנרשם עולה אוטומטית." },
    { title: "ביקורות אמיתיות בלבד", body: "ביקורות עוברות מודרציה לפני פרסום, כדי שהדירוג שאתם רואים יהיה אמין." },
    { title: "פריסה ארצית", body: "עסקים מכל אזורי הארץ — צפון, מרכז, דרום — במקום אחד." },
    { title: "השוואה הוגנת", body: "עסקים מומלצים נבחרים לפי דירוג וביקורות, לא לפי מי ששילם הכי הרבה." },
  ],
};

/** settings.about.content — טקסט עמוד "אודות", ניתן לעריכה מ-/admin/settings. */
export async function getAboutContent(): Promise<AboutContent> {
  if (!isSupabaseConfigured) return FALLBACK_ABOUT;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return FALLBACK_ABOUT;

  const { data } = await supabase
    .from("settings").select("value").eq("key", "about.content").maybeSingle();

  if (!data) return FALLBACK_ABOUT;
  const v = data.value as Partial<AboutContent>;
  const points = Array.isArray(v.points) && v.points.length === 4 ? v.points : FALLBACK_ABOUT.points;
  return {
    intro: v.intro?.trim() || FALLBACK_ABOUT.intro,
    points: points.map((p, i) => ({
      title: p?.title?.trim() || FALLBACK_ABOUT.points[i].title,
      body: p?.body?.trim() || FALLBACK_ABOUT.points[i].body,
    })),
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
