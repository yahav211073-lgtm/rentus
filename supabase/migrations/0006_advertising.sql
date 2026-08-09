-- ============================================================================
-- 0006 — מערכת הפרסום: באנרים צדדיים, פופאפים, מדידה
--
-- שתי הטבלאות banners ו-popup_banners חולקות מודל מיקוד זהה (targeting),
-- אבל נשארות נפרדות בכוונה: לפופאפ יש כללי הצגה (exit intent, גלילה,
-- הגבלת תדירות) שלבאנר צדדי אין, ואיחוד שלהן היה יוצר טבלה שחצי
-- מהעמודות שלה תמיד null.
--
-- מודל המיקוד (jsonb targeting) נראה כך:
--   {
--     "categories": ["<uuid>"],      -- הצג רק בקטגוריות האלה
--     "cities":     ["<uuid>"],
--     "devices":    ["desktop","mobile","tablet"],
--     "audience":   "all" | "guests" | "logged_in" | "business_owners",
--     "paths":      ["/", "/search"],   -- נתיבים מדויקים או תבניות
--     "exclude_paths": ["/admin"]
--   }
-- ריק = ללא הגבלה. הבדיקה עצמה נעשית באפליקציה (src/lib/ads/targeting.ts),
-- כי היא צריכה להתבצע גם על ההקשר של הבקשה שאין ל-DB גישה אליו.
-- ============================================================================

do $$ begin
  create type public.creative_kind as enum ('image', 'gif', 'video', 'lottie', 'html');
exception when duplicate_object then null; end $$;


-- ============================================================================
-- מיקומי פרסום
--
-- טבלה ולא enum, כי מנהל שרוצה מיקום חדש ("מתחת לתוצאה השלישית")
-- לא אמור להמתין לדיפלוי.
-- ============================================================================

create table if not exists public.ad_placements (
  key          text primary key,           -- 'side_left', 'side_right', 'inline_results'
  label        text not null,
  description  text,
  -- ממדים מומלצים, מוצגים למנהל במסך ההעלאה כדי למנוע קריאייטיב מעוות
  width        integer,
  height       integer,
  is_active    boolean not null default true
);


-- ============================================================================
-- באנרים
-- ============================================================================

create table if not exists public.banners (
  id            uuid primary key default gen_random_uuid(),
  placement_key text not null references public.ad_placements(key) on delete cascade,
  business_id   uuid references public.businesses(id) on delete set null,  -- אם זה קידום עסק

  title         text not null,             -- לזיהוי פנימי במסך הניהול
  kind          public.creative_kind not null default 'image',
  -- לפי kind: image/gif → url, video → url, lottie → url ל-JSON, html → html
  asset_url     text,
  asset_url_mobile text,                   -- קריאייטיב נפרד למובייל
  html          text,
  alt           text,                      -- חובה לנגישות
  href          text,
  target_blank  boolean not null default true,

  targeting     jsonb not null default '{}'::jsonb,

  -- תזמון
  starts_at     timestamptz,
  ends_at       timestamptz,
  -- שעות ביום שבהן מותר להציג, 0–23. ריק = תמיד.
  active_hours  smallint[] not null default '{}',
  active_days   smallint[] not null default '{}',   -- 0=ראשון

  -- סבב הצגה: משקל גבוה יותר = מוצג יותר כשיש כמה באנרים באותו מיקום
  weight        smallint not null default 1 check (weight between 1 and 100),
  priority      smallint not null default 0,

  -- תקרות. null = ללא הגבלה. נאכף בשכבת ההגשה.
  max_impressions integer,
  max_clicks      integer,

  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.banners.weight is
  'משקל בסבב ההצגה. בחירה משוקללת אקראית בין הבאנרים הכשירים לאותו מיקום.';

create index if not exists banners_placement_idx on public.banners(placement_key, is_active);
create index if not exists banners_schedule_idx  on public.banners(starts_at, ends_at) where is_active;
create index if not exists banners_business_idx  on public.banners(business_id);


-- ============================================================================
-- פופאפים
-- ============================================================================

do $$ begin
  create type public.popup_kind as enum (
    'promotion', 'announcement', 'coupon', 'newsletter',
    'business_promo', 'holiday'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.popup_layout as enum (
    'modal', 'fullscreen', 'slide', 'bottom_bar', 'corner'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.popup_trigger as enum (
    'immediate', 'delay', 'scroll', 'exit_intent', 'first_visit', 'returning_visitor'
  );
exception when duplicate_object then null; end $$;


create table if not exists public.popup_banners (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  kind           public.popup_kind   not null default 'promotion',
  layout         public.popup_layout not null default 'modal',

  -- תוכן
  heading        text,
  body           text,
  creative_kind  public.creative_kind not null default 'image',
  asset_url      text,
  alt            text,
  cta_label      text,
  cta_href       text,
  secondary_label text,
  -- ערכת צבעים ספציפית לפופאפ. null = צבעי המותג.
  theme          jsonb not null default '{}'::jsonb,

  -- כלל הצגה
  trigger_type   public.popup_trigger not null default 'delay',
  trigger_delay_sec  integer not null default 5,
  trigger_scroll_pct smallint not null default 50 check (trigger_scroll_pct between 0 and 100),

  targeting      jsonb not null default '{}'::jsonb,

  -- הגבלת תדירות. זו העמודה שמפרידה בין קמפיין לבין מטרד.
  -- כמה פעמים מותר להציג לאותו גולש, ובתוך כמה שעות.
  max_shows_per_user  smallint not null default 1,
  cooldown_hours      integer  not null default 24,
  -- אחרי סגירה ידנית — לא להציג שוב במשך כך וכך שעות
  dismiss_cooldown_hours integer not null default 168,

  starts_at      timestamptz,
  ends_at        timestamptz,
  priority       smallint not null default 0,
  is_active      boolean not null default false,   -- ברירת מחדל כבוי. פופאפ עולה לאוויר רק בכוונה.

  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.popup_banners.is_active is
  'ברירת מחדל false בכוונה — פופאפ לא אמור לעלות לאוויר בטעות בזמן עריכה.';
comment on column public.popup_banners.dismiss_cooldown_hours is
  'גולש שסגר ידנית הביע דעה. ברירת מחדל שבוע.';

create index if not exists popup_banners_active_idx on public.popup_banners(is_active, priority desc);


-- ============================================================================
-- קופונים
-- ============================================================================

create table if not exists public.coupons (
  code           text primary key,
  business_id    uuid references public.businesses(id) on delete cascade,
  title          text not null,
  description    text,
  discount_type  text not null default 'percent' check (discount_type in ('percent', 'fixed', 'gift')),
  discount_value numeric(12,2),
  terms          text,
  starts_at      timestamptz,
  expires_at     timestamptz,
  max_uses       integer,
  used_count     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists coupons_business_idx on public.coupons(business_id) where is_active;


-- ============================================================================
-- מדידה
--
-- טבלת אירועים גולמית אחת, ושתי טבלאות סיכום יומיות.
-- הסיבה: מסך ה-CTR באדמין לא יכול לסרוק מיליוני שורות גולמיות בכל טעינה,
-- אבל כן צריך את הגולמי כדי לחקור אנומליות. הסיכום נבנה בעבודה מתוזמנת.
-- ============================================================================

do $$ begin
  create type public.ad_event_type as enum ('impression', 'click', 'close', 'conversion');
exception when duplicate_object then null; end $$;


create table if not exists public.ad_events (
  id           bigserial primary key,
  banner_id    uuid references public.banners(id) on delete cascade,
  popup_id     uuid references public.popup_banners(id) on delete cascade,
  event_type   public.ad_event_type not null,
  -- מזהה אנונימי מה-cookie. לא מקושר למשתמש אלא אם הוא מחובר.
  visitor_hash text,
  user_id      uuid references public.profiles(id) on delete set null,
  path         text,
  device       text,
  city_id      uuid references public.cities(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- בדיוק אחד מהשניים חייב להיות מלא
alter table public.ad_events drop constraint if exists ad_events_one_target;
alter table public.ad_events add constraint ad_events_one_target
  check ((banner_id is not null) <> (popup_id is not null));

create index if not exists ad_events_banner_idx on public.ad_events(banner_id, event_type, created_at desc);
create index if not exists ad_events_popup_idx  on public.ad_events(popup_id,  event_type, created_at desc);
create index if not exists ad_events_date_idx   on public.ad_events(created_at desc);


-- מפתח ראשי סינתטי ולא (day, banner_id, popup_id): עמודות במפתח ראשי
-- חייבות להיות NOT NULL, וכאן בדיוק אחת מהשתיים תמיד null.
-- הייחודיות נאכפת בשני אינדקסים חלקיים במקום.
create table if not exists public.ad_stats_daily (
  id           bigserial primary key,
  day          date not null,
  banner_id    uuid references public.banners(id) on delete cascade,
  popup_id     uuid references public.popup_banners(id) on delete cascade,
  impressions  integer not null default 0,
  clicks       integer not null default 0,
  closes       integer not null default 0,
  conversions  integer not null default 0
);

create unique index if not exists ad_stats_daily_banner_uniq
  on public.ad_stats_daily(day, banner_id) where banner_id is not null;
create unique index if not exists ad_stats_daily_popup_uniq
  on public.ad_stats_daily(day, popup_id)  where popup_id  is not null;

-- CTR מחושב ולא מאוחסן — שמירה שלו רק יוצרת הזדמנות לחוסר עקביות
create or replace view public.ad_stats_daily_ctr as
  select *,
         case when impressions > 0
              then round((clicks::numeric / impressions) * 100, 2)
              else 0 end as ctr_pct
  from public.ad_stats_daily;


-- מציג את הגולש שכבר ראה פופאפ — הבסיס להגבלת התדירות.
-- נשמר בשרת ולא רק ב-localStorage, אחרת ניקוי דפדפן מאפס את הכל
-- והגולש רואה את אותו פופאפ שוב.
create table if not exists public.popup_views (
  visitor_hash text not null,
  popup_id     uuid not null references public.popup_banners(id) on delete cascade,
  shown_count  smallint not null default 1,
  last_shown_at timestamptz not null default now(),
  dismissed_at timestamptz,
  converted_at timestamptz,
  primary key (visitor_hash, popup_id)
);


do $$
declare t text;
begin
  foreach t in array array['banners', 'popup_banners'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
