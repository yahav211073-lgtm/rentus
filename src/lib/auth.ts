import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
}

/** המשתמש המחובר + הפרופיל שלו, או null אם אין סשן / Supabase לא מוגדר. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as UserRole) ?? "user",
  };
}

const STAFF_ROLES: UserRole[] = ["admin", "moderator", "editor"];

/**
 * שער הרשאה לפעולות ניהול. proxy.ts כבר חוסם גישה לנתיבי /admin
 * במי שאינו staff, אבל Server Actions נקראות גם ישירות (לא רק דרך
 * ניווט לעמוד) — לכן כל פעולת ניהול חייבת לבדוק שוב בעצמה, ולא
 * לסמוך על ההגנה בנתיב. זו הבדיקה ש-createSupabaseAdminClient()
 * מניח שכבר קרתה (ראו ההערה שם).
 */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    throw new Error("אין הרשאה לפעולה זו.");
  }
  return user;
}
