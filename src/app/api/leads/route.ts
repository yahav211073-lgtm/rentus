import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVisitorHash } from "@/lib/visitor";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * קליטת פנייה **לאתר** — לא לעסק.
 *
 * הטופס שפנה לעסק בודד בוטל כהחלטת מוצר: הגולש פונה ישירות בטלפון
 * או בוואטסאפ, ולכן business_id כאן תמיד null. מה שכן נכנס דרך
 * המסלול הזה: בקשה לפרסם באתר (ad_request) ופנייה כללית (contact).
 * שתיהן נוחתות באותה תיבת פניות בניהול, ונבדלות בשדה kind.
 *
 * הגנות, בסדר שבו הן פועלות:
 *   1. שדה דבש — נבדק כבר בלקוח, ושוב כאן. בוט שמדלג על ה-JS
 *      עדיין נתפס.
 *   2. אימות מבנה — טלפון ישראלי תקין, לא סתם מחרוזת.
 *   3. הגבלת קצב לפי מבקר: 5 פניות בשעה. בקשת פרסום היא פעולה
 *      חד-פעמית, ומי ששולח שש בשעה אינו מפרסם פוטנציאלי.
 *
 * זו הגנה מפני ספאם אוטומטי בסיסי בלבד — לא CAPTCHA ולא אימות
 * זהות. אותה מגבלה מקובלת שכבר מתועדת לטופס ההרשמה.
 */

// מספר ישראלי: נייד או קווי, עם או בלי מקף, עם או בלי קידומת בינ"ל
const PHONE_RE = /^(?:\+972|0)(?:[23489]|5[0-9]|7[0-9])[-\s]?\d{7}$/;

const Schema = z.object({
  kind: z.enum(["ad_request", "contact"]),
  name: z.string().min(2, "שם קצר מדי").max(80),
  phone: z.string().regex(PHONE_RE, "מספר טלפון לא תקין"),
  email: z.string().email("כתובת אימייל לא תקינה").max(254).optional().or(z.literal("")),
  /** שם העסק/המותג שמבקש לפרסם */
  businessName: z.string().max(120).optional(),
  /** המיקום המבוקש באתר, כפי שנבחר בטופס */
  placement: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  sourcePage: z.string().max(512).optional(),
  company: z.string().max(0).optional(),   // שדה דבש — חייב להיות ריק
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" },
      { status: 400 },
    );
  }

  const { kind, name, phone, email, businessName, placement, message, sourcePage } = parsed.data;

  const visitor = await getVisitorHash();
  const allowed = await checkRateLimit(`lead:v:${visitor}`, { max: 5, windowMinutes: 60 });
  if (!allowed) {
    return NextResponse.json(
      { error: "יותר מדי פניות. נסו שוב בעוד שעה." },
      { status: 429 },
    );
  }

  if (!isSupabaseConfigured) {
    // בפיתוח, בלי מסד נתונים — מאשרים כדי שהטופס יהיה בדיק
    return NextResponse.json({ ok: true, dev: true });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "השירות אינו זמין כרגע" }, { status: 503 });
  }

  /* הכותרת נבנית כאן ולא בממשק הניהול: רשימת הפניות צריכה להיות
     קריאה במבט אחד, בלי לפתוח כל שורה כדי להבין במה מדובר. */
  const subject =
    kind === "ad_request"
      ? [businessName || name, placement].filter(Boolean).join(" — ")
      : "פנייה כללית";

  const { error } = await supabase.from("leads").insert({
    business_id: null,
    kind,
    subject,
    name,
    phone,
    email: email || null,
    message: message ?? null,
    extra: { businessName: businessName ?? null, placement: placement ?? null },
    channel: "form",
    source_page: sourcePage ?? null,
  });

  if (error) {
    console.error("[leads] insert failed:", error.message);
    return NextResponse.json({ error: "משהו השתבש. נסו שוב." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
