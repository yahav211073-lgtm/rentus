import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVisitorHash } from "@/lib/visitor";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * קליטת פנייה לעסק.
 *
 * הגנות, בסדר שבו הן פועלות:
 *   1. שדה דבש — נבדק כבר בלקוח, ושוב כאן. בוט שמדלג על ה-JS
 *      עדיין נתפס.
 *   2. אימות מבנה — טלפון ישראלי תקין, לא סתם מחרוזת.
 *   3. הגבלת קצב לפי מבקר: 10 פניות בשעה. אדם אמיתי שמשווה
 *      ספקים שולח 3–5; 10 זו כבר הצפה.
 *   4. הגבלת קצב לפי עסק: מונע הצפת תיבת הפניות של עסק יחיד.
 *
 * מה שלא נעשה כאן בכוונה: אימות שהעסק קיים דרך שאילתה נוספת.
 * מפתח זר על business_id כבר אוכף את זה ברמת מסד הנתונים,
 * ושאילתה מקדימה רק מוסיפה השהיה.
 */

// מספר ישראלי: נייד או קווי, עם או בלי מקף, עם או בלי קידומת בינ"ל
const PHONE_RE = /^(?:\+972|0)(?:[23489]|5[0-9]|7[0-9])[-\s]?\d{7}$/;

const Schema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2, "שם קצר מדי").max(80),
  phone: z.string().regex(PHONE_RE, "מספר טלפון לא תקין"),
  email: z.string().email().max(254).optional(),
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

  const { businessId, name, phone, email, message, sourcePage } = parsed.data;

  const visitor = await getVisitorHash();
  const [visitorOk, businessOk] = await Promise.all([
    checkRateLimit(`lead:v:${visitor}`, { max: 10, windowMinutes: 60 }),
    checkRateLimit(`lead:b:${businessId}`, { max: 60, windowMinutes: 60 }),
  ]);

  if (!visitorOk || !businessOk) {
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

  const { error } = await supabase.from("leads").insert({
    business_id: businessId,
    name,
    phone,
    email: email ?? null,
    message: message ?? null,
    channel: "form",
    source_page: sourcePage ?? null,
  });

  if (error) {
    console.error("[leads] insert failed:", error.message);
    return NextResponse.json({ error: "משהו השתבש. נסו שוב." }, { status: 500 });
  }

  // TODO: התראה לבעל העסק (מייל + וואטסאפ) ורשומה ב-notifications.

  return NextResponse.json({ ok: true });
}
