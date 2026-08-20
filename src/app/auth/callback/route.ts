import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * יעד החזרה מ-OAuth (Google וכו').
 *
 * Supabase מפנה לכאן עם `code` אחרי שהמשתמש מאשר אצל הספק; מחליפים
 * אותו בסשן אמיתי ואז ממשיכים ליעד שביקשו במקור (`next`).
 *
 * חישוב ה-origin הוא הנקודה העדינה כאן. `new URL(request.url).origin`
 * מחזיר את הכתובת שבה הפונקציה **רצה**, ומאחורי הפרוקסי של ורסל זו
 * לא הכתובת שהגולש רואה — כלומר ההפניה חזרה יכולה לנחות על מארח
 * פנימי או על localhost. לכן קוראים קודם את כותרות ה-forwarded,
 * שהן המקור האמין היחיד לדומיין הציבורי, ונופלים ל-origin של הבקשה
 * רק בפיתוח מקומי שבו אין פרוקסי.
 *
 * `next` נבדק שהוא נתיב יחסי. בלי הבדיקה הזו ‎?next=https://evil.com‎
 * הופך את הנתיב הזה למפנה פתוח — התוקף שולח קישור התחברות לגיטימי
 * לחלוטין של האתר, והקורבן נוחת אחרי ההתחברות באתר שלו.
 */
function publicOrigin(request: Request): string {
  const h = request.headers;
  const forwardedHost = h.get("x-forwarded-host");
  const forwardedProto = h.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

/** רק נתיב יחסי. כל דבר אחר מוחזר כשורש. */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const origin = publicOrigin(request);

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
