-- ============================================================================
-- 0001 — יסודות: הרחבות, פונקציות עזר, זהות והרשאות
--
-- כל קובץ מיגרציה כאן הוא idempotent — אפשר להריץ אותו שוב בלי לשבור כלום.
-- להרצה: supabase db push   (או להעתיק ל-SQL Editor ולהריץ לפי הסדר)
--
-- מודל ההרשאות:
--   profiles.role  — התפקיד הראשי. קובע את ברירת המחדל.
--   permissions    — רשימת היכולות במערכת (למשל 'businesses.publish').
--   role_permissions — אילו יכולות יש לכל תפקיד. ניתן לעריכה מהאדמין.
--   user_permissions — חריגים ברמת המשתמש: מוסיפים או שוללים יכולת בודדת.
--
--   למה שתי שכבות: תפקידים מכסים 95% מהמקרים, אבל תמיד יש את המקרה של
--   "תן לעורך הזה גם גישה לחשבוניות". בלי שכבת החריגים נוצרים תפקידי-רפאים.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";       -- חיפוש מטושטש והשלמה אוטומטית
create extension if not exists "unaccent";      -- נרמול ניקוד וסימנים
create extension if not exists "citext";        -- אימיילים ללא תלות ברישיות


-- ============================================================================
-- פונקציות עזר
-- ============================================================================

-- מעדכן updated_at בכל UPDATE. מחובר כטריגר לכל טבלה שיש בה עמודה כזו.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- הופך טקסט חופשי ל-slug בטוח ל-URL. תומך עברית (משאיר אותיות עבריות),
-- כי /category/אולמות-אירועים קריא יותר מ-/category/cat-17 וגם עדיף ל-SEO.
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9֐-׿]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;


-- ============================================================================
-- פרופילים
--
-- auth.users הוא של Supabase ואסור לגעת בו. profiles היא ההרחבה שלנו,
-- עם אותו מזהה. נוצר אוטומטית בהרשמה על ידי טריגר בהמשך הקובץ.
-- ============================================================================

do $$ begin
  create type public.user_role as enum (
    'admin',           -- שליטה מלאה
    'moderator',       -- אישור עסקים, ניהול ביקורות
    'editor',          -- תוכן ו-SEO בלבד
    'business_owner',  -- בעל עסק — רואה רק את העסקים שלו
    'user'             -- גולש רשום
  );
exception when duplicate_object then null; end $$;


create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         citext,
  full_name     text,
  phone         text,
  avatar_url    text,
  role          public.user_role not null default 'user',
  locale        text not null default 'he',
  is_active     boolean not null default true,
  -- העדפות נגישות נשמרות פר-משתמש כדי שסרגל הנגישות יזכור בין מכשירים
  a11y_prefs    jsonb not null default '{}'::jsonb,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'הרחבה של auth.users — כל מה שהאפליקציה צריכה על משתמש';
comment on column public.profiles.a11y_prefs is 'העדפות סרגל הנגישות: גודל גופן, ניגודיות, עצירת אנימציות וכו''';

create index if not exists profiles_role_idx on public.profiles(role);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();


-- יצירת פרופיל אוטומטית בהרשמה.
-- security definer כי הטריגר רץ בהקשר של המשתמש החדש, שעדיין אין לו הרשאות.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- הרשאות גרנולריות
-- ============================================================================

create table if not exists public.permissions (
  key          text primary key,          -- 'businesses.publish'
  group_name   text not null,             -- 'עסקים' — לקיבוץ במסך הניהול
  label        text not null,             -- 'פרסום עסקים'
  description  text,
  created_at   timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role            public.user_role not null,
  permission_key  text not null references public.permissions(key) on delete cascade,
  primary key (role, permission_key)
);

create table if not exists public.user_permissions (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  permission_key  text not null references public.permissions(key) on delete cascade,
  -- granted=false שולל במפורש יכולת שהתפקיד כן נותן. שלילה גוברת על הענקה.
  granted         boolean not null default true,
  primary key (user_id, permission_key)
);

comment on column public.user_permissions.granted is
  'false = שלילה מפורשת. גוברת על ההרשאה שמגיעה מהתפקיד.';


-- ----------------------------------------------------------------------------
-- פונקציות ההרשאה שעליהן נשענות כל מדיניות ה-RLS.
--
-- כולן security definer + search_path קבוע. זה חשוב לאבטחה: בלי search_path
-- קבוע, משתמש יכול היה ליצור סכימה משלו ולהחליף את המשמעות של הטבלאות כאן.
--
-- וגם: הן קוראות מ-profiles בעקיפה של RLS, אחרת נוצרת רקורסיה אינסופית
-- (מדיניות על profiles שקוראת ל-current_role() שקוראת מ-profiles...).
-- ----------------------------------------------------------------------------

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;


create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;


create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'moderator', 'editor'), false);
$$;


create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    -- אדמין עוקף הכל. בלי זה אפשר לנעול את עצמך החוצה מהמערכת.
    when public.is_admin() then true
    -- שלילה מפורשת ברמת המשתמש גוברת על כל השאר
    when exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and permission_key = perm and granted = false
    ) then false
    when exists (
      select 1 from public.user_permissions
      where user_id = auth.uid() and permission_key = perm and granted = true
    ) then true
    else exists (
      select 1 from public.role_permissions
      where role = public.current_role() and permission_key = perm
    )
  end;
$$;

comment on function public.has_permission is
  'הבדיקה היחידה שמדיניות RLS צריכה לקרוא לה. סדר: אדמין > שלילה אישית > הענקה אישית > תפקיד.';
