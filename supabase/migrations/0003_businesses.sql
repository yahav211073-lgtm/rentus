-- ============================================================================
-- 0003 — עסקים: הליבה של הפלטפורמה
--
-- שיקולי תכנון עיקריים:
--
--   · דירוגים מנורמלים-לאחור (rating_avg / review_count על שורת העסק).
--     חישוב AVG על טבלת ביקורות בכל טעינת עמוד רשימה הוא הדבר הראשון
--     שנשבר בקנה מידה. הערכים מתוחזקים בטריגר ב-0004.
--
--   · tier נפרד מ-status. status = האם מותר להציג. tier = כמה בולט.
--     ערבוב של השניים ('published_premium') הופך כל שאילתה לסיוט.
--
--   · search_vector עם קונפיגורציית 'simple' ולא 'hebrew' — Postgres לא
--     מגיע עם מילון עברית. simple + pg_trgm נותן תוצאות טובות יותר
--     לעברית מאשר stemmer אנגלי שמשחית מילים עבריות.
-- ============================================================================

do $$ begin
  create type public.business_status as enum (
    'draft',      -- בעל העסק עדיין ממלא
    'pending',    -- ממתין לאישור מנהל
    'published',  -- חי באתר
    'rejected',   -- נדחה, עם סיבה
    'suspended',  -- הושעה אחרי פרסום
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.business_tier as enum ('free', 'basic', 'premium', 'enterprise');
exception when duplicate_object then null; end $$;


create table if not exists public.businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references public.profiles(id) on delete set null,

  -- זהות
  slug            text unique not null,
  name            text not null,
  legal_name      text,
  tagline         text,                     -- שורה אחת, מוצגת מתחת לשם
  description     text,
  founded_year    integer,

  -- מיון ומצב
  status          public.business_status not null default 'draft',
  tier            public.business_tier   not null default 'free',
  rejection_reason text,
  is_verified     boolean not null default false,  -- תג "מאומת" — נבדק ידנית
  is_featured     boolean not null default false,
  is_sponsored    boolean not null default false,
  -- ציון קידום ידני, 0–100. שובר שוויון במיון "מומלצים".
  boost_score     integer not null default 0 check (boost_score between 0 and 100),

  -- מיקום
  city_id         uuid references public.cities(id) on delete set null,
  area_id         uuid references public.areas(id)  on delete set null,
  address         text,
  address_note    text,                     -- 'קומה 2, מול המעלית'
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  -- עסק ללא כתובת פיזית שמגיע ללקוח (שירות עד הבית)
  is_mobile_service boolean not null default false,
  service_radius_km integer,

  -- יצירת קשר
  phone           text,
  phone_secondary text,
  whatsapp        text,
  email           citext,
  website         text,
  social          jsonb not null default '{}'::jsonb,   -- {facebook, instagram, tiktok, youtube, linkedin}

  -- מדיה
  logo_url        text,
  cover_url       text,
  video_url       text,

  -- מסחרי
  price_range     smallint check (price_range between 1 and 4),  -- ₪ עד ₪₪₪₪
  price_note      text,
  accepts_online_booking boolean not null default false,

  -- דירוגים (מנורמל-לאחור, מתוחזק בטריגר)
  rating_avg      numeric(2,1) not null default 0,
  review_count    integer not null default 0,

  -- מדדים (מתוחזקים אסינכרונית מטבלת האירועים)
  view_count      integer not null default 0,
  lead_count      integer not null default 0,

  -- SEO
  seo_title       text,
  seo_description text,
  seo_noindex     boolean not null default false,

  -- חיפוש
  search_vector   tsvector,

  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.businesses.boost_score is
  'קידום ידני 0–100. שובר שוויון במיון, לא עוקף אותו. עסק גרוע לא יעלה לראש בגלל 100.';
comment on column public.businesses.search_vector is
  'מתוחזק בטריגר. קונפיגורציית simple — ראו הערת הכותרת.';

create index if not exists businesses_status_idx    on public.businesses(status);
create index if not exists businesses_owner_idx     on public.businesses(owner_id);
create index if not exists businesses_city_idx      on public.businesses(city_id)  where status = 'published';
create index if not exists businesses_area_idx      on public.businesses(area_id)  where status = 'published';
create index if not exists businesses_rating_idx    on public.businesses(rating_avg desc, review_count desc) where status = 'published';
create index if not exists businesses_featured_idx  on public.businesses(is_featured) where status = 'published';
create index if not exists businesses_sponsored_idx on public.businesses(is_sponsored) where status = 'published';
create index if not exists businesses_created_idx   on public.businesses(created_at desc) where status = 'published';
create index if not exists businesses_search_idx    on public.businesses using gin (search_vector);
create index if not exists businesses_name_trgm     on public.businesses using gin (name gin_trgm_ops);


-- מתחזק את search_vector. המשקלים חשובים:
--   A = שם העסק, B = שורת תיאור וקטגוריות, C = תיאור מלא, D = כתובת.
-- בלי משקלים, עסק שמזכיר "אולם" 20 פעם בתיאור מנצח אולם ששמו "אולם X".
create or replace function public.businesses_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
      setweight(to_tsvector('simple', unaccent(coalesce(new.name, ''))), 'A')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.tagline, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.description, ''))), 'C')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.address, ''))), 'D');
  return new;
end;
$$;

drop trigger if exists businesses_search_vector on public.businesses;
create trigger businesses_search_vector
  before insert or update of name, tagline, description, address
  on public.businesses
  for each row execute function public.businesses_search_vector_update();


-- מוודא ש-published_at מסומן פעם אחת, בפרסום הראשון
create or replace function public.businesses_stamp_published()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published'
     and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_stamp_published on public.businesses;
create trigger businesses_stamp_published
  before update on public.businesses
  for each row execute function public.businesses_stamp_published();


-- ============================================================================
-- שיוך לקטגוריות (רבים-לרבים)
--
-- עסק יכול להיות גם "אולם אירועים" וגם "קייטרינג". is_primary קובע
-- לאיזו קטגוריה הוא שייך בפירורי הלחם וב-canonical URL — בדיוק אחת.
-- ============================================================================

create table if not exists public.business_categories (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  is_primary   boolean not null default false,
  primary key (business_id, category_id)
);

create index if not exists business_categories_category_idx on public.business_categories(category_id);

-- בדיוק קטגוריה ראשית אחת לעסק
create unique index if not exists business_categories_one_primary
  on public.business_categories(business_id) where is_primary;


create table if not exists public.business_tags (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  tag_id       uuid not null references public.tags(id) on delete cascade,
  primary key (business_id, tag_id)
);

create index if not exists business_tags_tag_idx on public.business_tags(tag_id);


-- ============================================================================
-- שעות פעילות
--
-- שורה לכל טווח, לא עמודה לכל יום. זה מה שמאפשר "09:00–14:00, 17:00–21:00"
-- ביום אחד — מקרה נפוץ מאוד בישראל (הפסקת צהריים) ששובר כל סכימה
-- שמניחה טווח יחיד ליום.
-- ============================================================================

create table if not exists public.business_hours (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 0 and 6),  -- 0 = ראשון
  opens_at     time,
  closes_at    time,
  is_closed    boolean not null default false,
  -- 24/7 או "פתוח עד אחרון הלקוחות"
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists business_hours_business_idx on public.business_hours(business_id, day_of_week);

alter table public.business_hours drop constraint if exists business_hours_valid_range;
alter table public.business_hours add constraint business_hours_valid_range
  check (is_closed or (opens_at is not null and closes_at is not null));


-- חריגים: חגים, חופשות, יום פתוח מיוחד. גובר על שעות הפעילות הרגילות.
create table if not exists public.business_hour_overrides (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  date         date not null,
  opens_at     time,
  closes_at    time,
  is_closed    boolean not null default true,
  label        text,                       -- 'ערב ראש השנה'
  unique (business_id, date)
);


-- ============================================================================
-- שירותים ומחירון
-- ============================================================================

create table if not exists public.business_services (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  description  text,
  price        numeric(12,2),
  price_unit   text,                       -- 'לשעה', 'למנה', 'החל מ-'
  duration_min integer,
  is_featured  boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists business_services_business_idx on public.business_services(business_id);


-- ============================================================================
-- מדיה וגלריה
--
-- טבלה אחת לכל סוגי המדיה. kind מבדיל ביניהם.
-- blur_hash נשמר בעת ההעלאה כדי לאפשר טעינת תמונה מדורגת אמיתית
-- (placeholder מטושטש) בלי round-trip נוסף לשרת.
-- ============================================================================

do $$ begin
  create type public.media_kind as enum ('image', 'video', 'document', 'lottie');
exception when duplicate_object then null; end $$;


create table if not exists public.media (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid references public.businesses(id) on delete cascade,
  uploaded_by    uuid references public.profiles(id) on delete set null,
  kind           public.media_kind not null default 'image',
  storage_path   text not null,            -- הנתיב ב-Supabase Storage
  url            text not null,
  alt            text,                     -- חובה בפועל — נאכף באפליקציה לנגישות
  caption        text,
  width          integer,
  height         integer,
  size_bytes     bigint,
  mime_type      text,
  blur_hash      text,
  sort_order     integer not null default 0,
  is_cover       boolean not null default false,
  created_at     timestamptz not null default now()
);

comment on column public.media.blur_hash is
  'נוצר בהעלאה. משמש כ-placeholder בטעינה מדורגת — מונע CLS.';

create index if not exists media_business_idx on public.media(business_id, sort_order);


-- ============================================================================
-- בקשת בעלות על עסק
--
-- עסק יכול להיווצר על ידי המערכת (ייבוא) ורק אחר כך מישהו טוען שהוא הבעלים.
-- זה זרם נפרד מהרשמה, ודורש אישור מנהל.
-- ============================================================================

create table if not exists public.business_claims (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  evidence     text,                       -- איך הוא מוכיח בעלות
  contact_phone text,
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  note         text,
  created_at   timestamptz not null default now(),
  unique (business_id, user_id)
);


do $$
declare t text;
begin
  foreach t in array array['businesses', 'business_services'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
