-- ============================================================================
-- 0016 — סגירת הסלמת הרשאות דרך profiles
--
-- הבעיה: profiles_update_own (0009_rls.sql:48) מתירה עדכון של **כל עמודה**
-- בשורה של המשתמש עצמו, כולל role. בניגוד ל-businesses ול-reviews שקיבלו
-- הגבלת עמודות ב-GRANT בסוף 0009, על profiles לא הופעלה שום הגבלה כזו,
-- ולא קיים טריגר שחוסם שינוי role (grep על כל המיגרציות מחזיר רק
-- profiles_touch). ההערות ב-0009_rls.sql:47 וב-admin/users/actions.ts:12
-- מתארות הגנה שמעולם לא נכתבה.
--
-- כלומר: כל משתמש מחובר יכול היה להריץ בקונסול
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', <uid>)
-- ולהפוך לאדמין. ומאחר ש-"Confirm email" מכובה וההרשמה פתוחה (CLAUDE.md),
-- זה היה פתוח לכל אדם באינטרנט, לא רק למשתמש קיים.
--
-- שתי שכבות, בכוונה — בדיוק כמו הדפוס שכבר קיים על businesses:
--   1. GRANT ברמת העמודה — התפקיד authenticated פשוט לא יכול לכתוב ל-role.
--   2. טריגר — תופס גם נתיב שעוקף את ה-GRANT (למשל פונקציית
--      security definer עתידית שתיכתב בלי מחשבה).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. הגבלת עמודות
--
-- authenticated לא כותב ל-email: זהו מקור הזהות, והוא מסונכרן מ-auth.users
-- דרך handle_new_user. שינוי שלו כאן היה מנתק את הפרופיל מהחשבון.
--
-- role ו-is_active **כן** נמצאים ב-GRANT, ובכוונה: updateUserRole()
-- (admin/users/actions.ts) רץ דרך לקוח הסשן של המנהל — כלומר בתפקיד
-- authenticated — ובלי ההרשאה הזו גם מנהל אמיתי לא היה יכול לשנות תפקיד.
-- GRANT הוא כלי בינארי ולא יודע לומר "רק אם is_admin()"; לכן האכיפה על שתי
-- העמודות האלה היא הטריגר בסעיף 2, וה-GRANT מגן על email בלבד.
-- ----------------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (full_name, phone, avatar_url, locale, a11y_prefs, last_seen_at,
              role, is_active)
  on public.profiles to authenticated;


-- ----------------------------------------------------------------------------
-- 2. טריגר על שינוי תפקיד/סטטוס
--
-- לא security definer בכוונה: הפונקציה חייבת לרוץ בהקשר של הסשן הקורא
-- כדי ש-is_admin() תשקף את מי שבאמת מבצע את הפעולה.
--
-- service_role מקבל פטור מפורש — הוא הנתיב שדרכו רצות עבודות שרת
-- (createSupabaseAdminClient), ואין לו auth.uid() כך ש-is_admin() תמיד
-- תחזיר false עבורו.
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active then

    if current_setting('role', true) = 'service_role'
       or (select auth.jwt() ->> 'role') = 'service_role' then
      return new;
    end if;

    if not public.is_admin() then
      raise exception 'שינוי תפקיד או סטטוס חשבון שמור למנהל ראשי בלבד.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

comment on function public.guard_profile_privileges is
  'חוסם שינוי role/is_active למי שאינו admin. שכבה שנייה מעל הגבלת ה-GRANT
   ב-0016 — ראו את ההסבר בראש הקובץ.';
