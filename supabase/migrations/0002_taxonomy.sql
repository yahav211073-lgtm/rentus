-- ============================================================================
-- 0002 — טקסונומיה וגאוגרפיה: קטגוריות, תת-קטגוריות, אזורים, ערים
--
-- הכל נערך מהאדמין. אין קטגוריה אחת קשיחה בקוד — זו דרישה מפורשת,
-- וגם מה שמאפשר לאותה פלטפורמה לשרת אינדקס אירועים, אינדקס בעלי מקצוע
-- או אינדקס נדל"ן בלי שינוי קוד.
-- ============================================================================


-- ============================================================================
-- אזורים וערים
-- ============================================================================

create table if not exists public.areas (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,              -- 'מרכז'
  name_en      text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.cities (
  id           uuid primary key default gen_random_uuid(),
  area_id      uuid references public.areas(id) on delete set null,
  slug         text unique not null,
  name         text not null,              -- 'תל אביב-יפו'
  name_en      text,
  -- שמות נרדפים לחיפוש: 'ת"א', 'תל אביב', 'TLV'. מוזן לאינדקס ההשלמה.
  aliases      text[] not null default '{}',
  latitude     numeric(9,6),
  longitude    numeric(9,6),
  population   integer,
  sort_order   integer not null default 0,
  is_popular   boolean not null default false,  -- מוצגת בקיצורי הדרך בעמוד הבית
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.cities.aliases is
  'כתיבים חלופיים לחיפוש. ''ת"א'' חייב למצוא את תל אביב.';

create index if not exists cities_area_idx    on public.cities(area_id);
create index if not exists cities_popular_idx on public.cities(is_popular) where is_active;
create index if not exists cities_name_trgm   on public.cities using gin (name gin_trgm_ops);


-- ============================================================================
-- קטגוריות
--
-- מבנה היררכי בטבלה אחת (parent_id) ולא שתי טבלאות נפרדות
-- category/subcategory. הסיבה: לקוחות תמיד מבקשים רמה שלישית בסוף,
-- ושתי טבלאות נפרדות מחייבות אז מיגרציה כואבת.
-- העומק בפועל נאכף באפליקציה (2 רמות בממשק היום).
-- ============================================================================

create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.categories(id) on delete cascade,
  slug          text unique not null,
  name          text not null,
  name_en       text,
  description   text,
  -- שם אייקון מתוך ספריית האייקונים באפליקציה (lucide), לא נתיב לקובץ,
  -- כדי שהאייקונים יישארו וקטוריים ומותאמי-ערכת-נושא.
  icon          text,
  image_url     text,
  -- צבע מבטא לכרטיס הקטגוריה. null = ברירת המחדל של המותג.
  accent_color  text,
  synonyms      text[] not null default '{}',
  sort_order    integer not null default 0,
  is_featured   boolean not null default false,
  is_active     boolean not null default true,
  -- SEO ברמת הקטגוריה. ריק = נוצר אוטומטית מהשם ומספר העסקים.
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists categories_parent_idx   on public.categories(parent_id);
create index if not exists categories_featured_idx on public.categories(is_featured) where is_active;
create index if not exists categories_name_trgm    on public.categories using gin (name gin_trgm_ops);

-- מונע מקטגוריה להיות ההורה של עצמה
alter table public.categories drop constraint if exists categories_no_self_parent;
alter table public.categories add constraint categories_no_self_parent
  check (parent_id is null or parent_id <> id);


-- ============================================================================
-- תגיות חופשיות
--
-- מתלבשות מעל הקטגוריות: 'פתוח בשבת', 'נגיש לנכים', 'ידידותי לחיות'.
-- מאפשר סינון חוצה-קטגוריות בלי לנפח את עץ הקטגוריות.
-- ============================================================================

create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  icon        text,
  is_filter   boolean not null default true,  -- להציג כצ'קבוקס במסננים?
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);


-- טריגרים ל-updated_at
do $$
declare t text;
begin
  foreach t in array array['areas', 'cities', 'categories'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
