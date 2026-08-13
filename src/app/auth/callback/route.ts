import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * יעד החזרה מ-OAuth (Google וכו'). Supabase מפנה לכאן עם `code`
 * אחרי שהמשתמש מאשר אצל הספק; מחליפים אותו בסשן אמיתי ואז ממשיכים
 * ליעד שביקשו במקור (`next`), בדיוק כמו בכניסה/הרשמה עם סיסמה.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
