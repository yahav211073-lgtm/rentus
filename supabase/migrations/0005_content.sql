-- ============================================================================
-- 0005 — תוכן ו-CMS: כל מה שהמנהל עורך בלי לגעת בקוד
--
-- העיקרון: אין מחרוזת אחת קשיחה בקוד שהמנהל היה רוצה לשנות.
-- כותרות, סדר הסקציות בעמוד הבית, תפריטים, פוטר, צבעים, טיפוגרפיה —
-- הכל יושב כאן.
-- ============================================================================


-- ============================================================================
-- סקציות עמוד הבית
--
-- כל סקציה היא שורה עם type + props. האפליקציה ממפה type לרכיב React.
-- זה מה שמאפשר למנהל לגרור-ולשחרר סדר סקציות, לכבות סקציה, או להוסיף
-- שתי רצועות "מומלצים" עם מסננים שונים — בלי דיפלוי.
-- ============================================================================

create table if not exists public.homepage_sections (
  id           uuid primary key default gen_random_uuid(),
  -- 'hero' | 'search' | 'category_grid' | 'business_rail' | 'stats' |
  -- 'testimonials' | 'faq' | 'blog' | 'newsletter' | 'partners' | 'cta' | 'html'
  type         text not null,
  key          text unique not null,       -- מזהה יציב לשימוש בקוד/אנליטיקס
  title        text,
  subtitle     text,
  -- הגדרות ספציפיות לסוג: {source:'featured', limit:8, category_id:'...'}
  props        jsonb not null default '{}'::jsonb,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  -- הצגה מותנית: {devices:['desktop'], roles:['guest']}
  visibility   jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.homepage_sections is
  'עמוד הבית מורכב משורות כאן, לפי sort_order. type ממופה לרכיב React.';

create index if not exists homepage_sections_order_idx on public.homepage_sections(sort_order) where is_active;


-- ============================================================================
-- תפריטים (ניווט עליון, פוטר, מובייל)
-- ============================================================================

create table if not exists public.menus (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,        -- 'header' | 'footer_col_1' | 'mobile'
  title       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid not null references public.menus(id) on delete cascade,
  parent_id   uuid references public.menu_items(id) on delete cascade,
  label       text not null,
  href        text not null,
  icon        text,
  badge       text,                        -- 'חדש'
  target_blank boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

create index if not exists menu_items_menu_idx on public.menu_items(menu_id, sort_order);


-- ============================================================================
-- עמודי תוכן סטטיים (אודות, תנאי שימוש, פרטיות, נגישות)
-- ============================================================================

create table if not exists public.pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  -- תוכן עשיר כ-JSON מובנה (blocks) ולא HTML גולמי.
  -- HTML גולמי מהאדמין הוא וקטור XSS, וגם בלתי אפשרי לעצב עקבית.
  content      jsonb not null default '[]'::jsonb,
  excerpt      text,
  cover_url    text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  seo_title    text,
  seo_description text,
  seo_noindex  boolean not null default false,
  published_at timestamptz,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.pages.content is
  'בלוקים מובנים, לא HTML. מונע XSS ושומר על עיצוב אחיד.';


-- ============================================================================
-- בלוג / מאמרים
-- ============================================================================

create table if not exists public.article_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  sort_order  integer not null default 0
);

create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.article_categories(id) on delete set null,
  author_id    uuid references public.profiles(id) on delete set null,
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  content      jsonb not null default '[]'::jsonb,
  cover_url    text,
  cover_alt    text,
  -- זמן קריאה משוער בדקות. מחושב בשמירה, לא בזמן הצגה.
  reading_min  integer,
  tags         text[] not null default '{}',
  status       text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  is_featured  boolean not null default false,
  view_count   integer not null default 0,
  seo_title    text,
  seo_description text,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists articles_status_idx    on public.articles(status, published_at desc);
create index if not exists articles_category_idx  on public.articles(category_id);
create index if not exists articles_featured_idx  on public.articles(is_featured) where status = 'published';


-- ============================================================================
-- שאלות ותשובות
--
-- scope מאפשר לאותה טבלה לשרת גם את ה-FAQ הכללי בעמוד הבית וגם
-- FAQ ייעודי לקטגוריה — שניהם נכנסים ל-JSON-LD מסוג FAQPage.
-- ============================================================================

create table if not exists public.faq (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null default 'global',  -- 'global' | 'category' | 'business'
  scope_id     uuid,
  question     text not null,
  answer       text not null,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists faq_scope_idx on public.faq(scope, scope_id, sort_order) where is_active;


-- ============================================================================
-- המלצות ולוגואים של שותפים
-- ============================================================================

create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  author_role  text,
  author_avatar_url text,
  business_id  uuid references public.businesses(id) on delete set null,
  quote        text not null,
  rating       smallint check (rating between 1 and 5),
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text not null,
  href        text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);


-- ============================================================================
-- הגדרות מערכת
--
-- מפתח → ערך JSON. קבוצה אחת לכל תחום (brand, seo, contact, features...).
-- is_public קובע אם מותר לשלוח את הערך ללקוח — מפתחות API של ספקים
-- יושבים כאן עם is_public=false ולעולם לא מגיעים לדפדפן.
-- ============================================================================

create table if not exists public.settings (
  key         text primary key,            -- 'brand.colors', 'seo.defaults'
  group_name  text not null default 'general',
  label       text,
  value       jsonb not null default '{}'::jsonb,
  is_public   boolean not null default true,
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

comment on column public.settings.is_public is
  'false = לעולם לא נשלח לדפדפן. סודות יושבים כאן.';


-- ============================================================================
-- דגלי פיצ'ר
-- ============================================================================

create table if not exists public.feature_flags (
  key          text primary key,
  label        text not null,
  description  text,
  is_enabled   boolean not null default false,
  -- אחוז חשיפה 0–100 להשקה הדרגתית
  rollout_pct  smallint not null default 100 check (rollout_pct between 0 and 100),
  -- הפעלה לתפקידים ספציפיים בלבד — לבדיקה בפרודקשן לפני חשיפה
  roles        public.user_role[] not null default '{}',
  updated_at   timestamptz not null default now()
);


-- ============================================================================
-- דריסות SEO לנתיבים
--
-- לרוב העמודים המטא-דאטה נוצרת אוטומטית. הטבלה הזו היא ליוצאי הדופן:
-- כשמנהל רוצה כותרת ספציפית ל-/search?category=אולמות.
-- ============================================================================

create table if not exists public.seo_overrides (
  id           uuid primary key default gen_random_uuid(),
  path         text unique not null,       -- '/search' או '/category/אולמות-אירועים'
  title        text,
  description  text,
  og_image_url text,
  canonical    text,
  noindex      boolean not null default false,
  nofollow     boolean not null default false,
  -- JSON-LD נוסף שיוזרק לעמוד
  structured_data jsonb,
  updated_at   timestamptz not null default now()
);


-- ============================================================================
-- הפניות 301
-- ============================================================================

create table if not exists public.redirects (
  id           uuid primary key default gen_random_uuid(),
  source       text unique not null,
  destination  text not null,
  status_code  smallint not null default 301 check (status_code in (301, 302, 307, 308)),
  hit_count    integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);


do $$
declare t text;
begin
  foreach t in array array['homepage_sections', 'pages', 'articles', 'faq',
                           'settings', 'feature_flags', 'seo_overrides'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
