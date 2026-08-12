import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * מרענן את סשן ה-Supabase בכל בקשה, ומגן על נתיבי אדמין/דשבורד עסק.
 *
 * זה בדיוק ה"הרשענה" שהתייחסות בהערה ב-server.ts מניחה שקיימת — בלעדיו
 * טוקן שפג היה משאיר משתמש מחובר בצד הלקוח אבל לא בשרת.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // חובה — זה מה שבפועל מרענן טוקן שפג לפני שהוא מגיע ל-Server Component.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isOwnerRoute = pathname.startsWith("/business/dashboard");

  if ((isAdminRoute || isOwnerRoute) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const staffRoles = ["admin", "moderator", "editor"];
    if (!profile || !staffRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * כל הנתיבים חוץ מקבצים סטטיים ותמונות — כדי שהסשן יתרענן
     * בכל ניווט, לא רק בנתיבים המוגנים.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
