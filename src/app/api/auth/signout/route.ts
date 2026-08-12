import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/** התנתקות. נתיב API ולא Server Action כדי שקישור/כפתור רגיל עם
 * method="POST" יעבוד גם בלי JavaScript. */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();

  const redirectTo = new URL(request.url).searchParams.get("next") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, env.siteUrl));
}
