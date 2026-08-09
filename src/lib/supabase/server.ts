import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * לקוח Supabase לצד השרת.
 *
 * שלוש נקודות חשובות:
 *
 * 1. הלקוח נוצר מחדש בכל בקשה. לקוח משותף בין בקשות היה מדליף
 *    את הסשן של משתמש אחד למשתמש אחר — הבאג הכי מסוכן שיש
 *    באפליקציה מרובת משתמשים.
 *
 * 2. setAll עטוף ב-try/catch כי ב-Server Component אי אפשר לכתוב
 *    עוגיות. זה תקין: ה-middleware הוא זה שמרענן את הסשן, וה-catch
 *    כאן רק מונע קריסה כשקריאה לקריאה בלבד מנסה לרענן.
 *
 * 3. אם Supabase לא מוגדר מוחזר null, והקוד הקורא נופל לתוכן
 *    ההדגמה. זה מה שמאפשר להריץ את הפרויקט בלי מסד נתונים.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // נקרא מ-Server Component — הרענון מטופל ב-middleware
        }
      },
    },
  });
}

/**
 * לקוח עם מפתח שירות. עוקף RLS.
 *
 * לשימוש אך ורק בנתיבי API ובעבודות רקע, ורק אחרי שההרשאה נבדקה
 * בקוד. הוא לא נוגע בעוגיות ולא מזהה משתמש — ולכן כל שימוש בו
 * הוא "אני יודע מה אני עושה" מפורש.
 */
export function createSupabaseAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceKey) return null;

  return createServerClient(env.supabaseUrl, env.supabaseServiceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
