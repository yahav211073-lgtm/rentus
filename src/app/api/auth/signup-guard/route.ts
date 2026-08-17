import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVisitorHash } from "@/lib/visitor";

/**
 * שער לפני הרשמה עם אימייל+סיסמה.
 *
 * ההרשמה בפועל (auth.signUp) קורית בדפדפן דרך supabase-js, כדי
 * שהסשן ייכתב ישירות לעוגיות בלי תלות בשרת שלנו — בדיוק כמו כניסה
 * ב-login/page.tsx. הנתיב הזה הוא רק שער לפניה: שדה דבש והגבלת
 * קצב, כמו בכל טופס ציבורי אחר באתר (leads, newsletter).
 *
 * זה לא מחליף אימות זהות — ראו התיעוד ב-signup/page.tsx וב-CLAUDE.md
 * לגבי ההחלטה המכוונת להסיר את אימות המייל.
 */
const Schema = z.object({
  email: z.string().email().max(254),
  company: z.string().max(0).optional(), // שדה דבש — חייב להיות ריק
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
    return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });
  }

  const visitor = await getVisitorHash();
  const [visitorOk, emailOk] = await Promise.all([
    checkRateLimit(`signup:v:${visitor}`, { max: 5, windowMinutes: 60 }),
    checkRateLimit(`signup:e:${parsed.data.email}`, { max: 3, windowMinutes: 60 }),
  ]);

  if (!visitorOk || !emailOk) {
    return NextResponse.json({ error: "יותר מדי ניסיונות הרשמה. נסו שוב בעוד שעה." }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
