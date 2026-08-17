import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * התנתקות. נתיב API ולא Server Action כדי שקישור/כפתור רגיל עם
 * method="POST" יעבוד גם בלי JavaScript.
 *
 * ההפניה בונה מ-origin הבקשה עצמה, לא מ-env.siteUrl: הדפדפן כבר
 * נמצא בפועל על הדומיין הזה עם תעודת SSL תקינה שלו. הפניה לכתובת
 * קבועה ממשתנה סביבה שעלולה להיות לא מסונכרנת (למשל www. חסר, או
 * דומיין ישן) שולחת את הדפדפן לדומיין אחר עם תעודה לא תואמת —
 * בדיוק אזהרת "החיבור שלך לא פרטי" (ERR_CERT_AUTHORITY_INVALID).
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("next") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
