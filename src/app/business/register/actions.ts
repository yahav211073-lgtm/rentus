"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

/* מספר ישראלי — נייד או קווי, עם או בלי מקף וקידומת בינ"ל.
   אותה תבנית כמו ב-/api/leads, כדי שאותו מספר יתקבל בשני המקומות. */
const PHONE_RE = /^(?:\+972|0)(?:[23489]|5[0-9]|7[0-9])[-\s]?\d{7}$/;

const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : undefined),
    z.string().max(max).optional());

const optionalId = z.preprocess(
  (v) => (typeof v === "string" && v ? v : undefined),
  z.string().uuid("יש לבחור ערך תקין מהרשימה.").optional(),
);

const optionalPhone = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined),
  z.string().regex(PHONE_RE, "מספר הטלפון אינו תקין. לדוגמה: 050-0000000").optional(),
);

const HourRow = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isClosed: z.boolean(),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
});

/**
 * ולידציה של הטופס.
 *
 * הכל נבדק כאן ולא רק בדפדפן: השדות מגיעות כ-FormData ל-Server
 * Action, וקריאה ישירה אליה עוקפת כל בדיקה שנעשתה ב-HTML. `required`
 * ו-type="email" הם נוחות למשתמש; זו ההגנה.
 */
const Schema = z
  .object({
    name: z.preprocess((v) => String(v ?? "").trim(),
      z.string().min(2, "שם החברה חייב להיות באורך שני תווים לפחות.").max(120)),
    category: z.preprocess((v) => String(v ?? ""),
      z.string().uuid("יש לבחור קטגוריה.")),
    tagline: optionalText(160),
    description: optionalText(4000),
    city: optionalId,
    area: optionalId,
    address: optionalText(200),
    phone: optionalPhone,
    whatsapp: optionalPhone,
    email: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : undefined),
      z.string().email("כתובת האימייל אינה תקינה.").max(254).optional()),
    hours: z.preprocess((v) => {
      if (typeof v !== "string" || !v) return [];
      try { return JSON.parse(v); } catch { return []; }
    }, z.array(HourRow).max(7)),
  })
  .refine((d) => d.phone || d.whatsapp, {
    message: "צריך טלפון או וואטסאפ אחד לפחות כדי שנוכל לחזור אליכם.",
    path: ["phone"],
  })
  /* שעת סגירה לפני שעת פתיחה נשמרת בלי תלונה במסד ואז מוצגת
     בדף כ-"09:00 עד 08:00". השוואת מחרוזות עובדת כאן כי הפורמט
     הוא HH:MM עם אפסים מובילים. */
  .refine((d) => d.hours.every((h) => h.isClosed || h.closesAt > h.opensAt), {
    message: "שעת הסגירה חייבת להיות מאוחרת משעת הפתיחה.",
    path: ["hours"],
  });

export async function submitBusinessRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "צריך להתחבר כדי להגיש בקשה." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "אין חיבור למסד הנתונים." };

  const parsed = Schema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    city: formData.get("city"),
    area: formData.get("area"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    hours: formData.get("hours"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "יש שדה שלא מולא כראוי." };
  }

  const { name, category: categoryId, phone, whatsapp, hours } = parsed.data;

  const cover = await uploadPublicImage(formData.get("cover"), `owner/${user.id}`);
  if (!cover.ok) return { ok: false as const, error: cover.error };

  const slug = `${slugify(name) || "business"}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      slug,
      name,
      tagline: parsed.data.tagline || null,
      description: parsed.data.description || null,
      status: "pending",
      city_id: parsed.data.city || null,
      area_id: parsed.data.area || null,
      address: parsed.data.address || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: parsed.data.email || null,
      cover_url: cover.url,
    })
    .select("id")
    .single();

  if (error || !business) {
    console.error("[submitBusinessRequest] insert into businesses failed:", error);
    const fallback = "שמירת הבקשה נכשלה. נסו שוב או פנו אלינו בוואטסאפ.";
    const message =
      error?.code === "23503" && error.message.includes("city_id")
        ? "יש לבחור עיר תקינה מהרשימה."
        : error?.code === "42501" || error?.message?.includes("row-level security")
          ? "אין הרשאה לבצע פעולה זו. נסו להתחבר מחדש."
          : fallback;
    return { ok: false as const, error: message };
  }

  /* שעות פעילות.
     נכתבות רק כשהמגיש באמת סימן יום פתוח אחד לפחות. שבוע שכולו
     "סגור" הוא בדיוק "לא מילאתי" — וכתיבתו הייתה גורמת לדף העסק
     להציג טבלת שעות שאומרת שהעסק סגור תמיד, במקום פשוט לא להציג
     את הסקציה. זו הנקודה שבגללה הוספנו את השדה מלכתחילה. */
  const openDays = hours.filter((h) => !h.isClosed);
  if (openDays.length > 0) {
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
