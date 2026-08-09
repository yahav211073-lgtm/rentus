import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVisitorHash } from "@/lib/visitor";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * הרשמה לניוזלטר.
 *
 * · הרשמה כפולה: השורה נכנסת עם confirmed_at ריק. בלי לחיצה על
 *   הקישור במייל אף דיוור לא נשלח. זו דרישת חוק התקשורת
 *   (סעיף 30א), לא המלצה.
 *
 * · התשובה זהה בין "נרשם עכשיו" לבין "כבר רשום". אחרת הנתיב הזה
 *   הופך לכלי לבדיקה אם כתובת מסוימת רשומה למערכת — דליפת מידע
 *   קטנה אבל אמיתית.
 *
 * · הגבלת קצב לפי מזהה המבקר. בלי זה אפשר להשתמש בטופס כדי
 *   להפגיז כתובות זרות במיילים.
 */

const Schema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה").max(254),
  fullName: z.string().max(120).optional(),
  source: z.string().max(64).optional(),
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
      { error: parsed.error.issues[0]?.message ?? "כתובת אימייל לא תקינה" },
      { status: 400 },
    );
  }

  const visitor = await getVisitorHash();
  const allowed = await checkRateLimit(`newsletter:${visitor}`, { max: 5, windowMinutes: 60 });
  if (!allowed) {
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסו שוב בעוד שעה." },
      { status: 429 },
    );
  }

  // בלי Supabase מוגדר — מאשרים בלי לשמור, כדי שהטופס יהיה בדיק בפיתוח
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "השירות אינו זמין כרגע" }, { status: 503 });
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: parsed.data.email,
    full_name: parsed.data.fullName ?? null,
    source: parsed.data.source ?? null,
  });

  // 23505 = הפרת ייחודיות, כלומר הכתובת כבר רשומה.
  // מחזירים הצלחה בכוונה — ראו הערת הכותרת.
  if (error && error.code !== "23505") {
    console.error("[newsletter] insert failed:", error.message);
    return NextResponse.json({ error: "משהו השתבש. נסו שוב." }, { status: 500 });
  }

  // TODO: שליחת מייל האישור דרך ספק הדיוור, עם confirm_token מהשורה.

  return NextResponse.json({ ok: true });
}
