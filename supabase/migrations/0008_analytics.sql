-- ============================================================================
-- 0008 — אנליטיקס, חיפושים ויומני ביקורת
--
-- הערת פרטיות: אין כאן כתובת IP גולמית ואין fingerprint. הזיהוי היחיד
-- הוא visitor_hash — ערך אקראי מ-cookie ראשוני (first-party), שמתאפס
-- אם הגולש מנקה את הדפדפן. זה מספיק לספירת ביקורים ולהגבלת תדירות
-- פופאפים, ולא מספיק כדי לעקוב אחרי אדם.
-- ============================================================================


-- ============================================================================
-- שאילתות חיפוש
--
-- הטבלה הכי שימושית באינדקס עסקים: היא אומרת מה אנשים מחפשים
-- ולא מוצאים. result_count = 0 היא רשימת המשימות של צוות התוכן.
-- ============================================================================

create table if not exists public.search_queries (
  id            bigserial primary key,
  query         text not null,
  normalized    text not null,             -- lower + trim, לצורך קיבוץ
  category_id   uuid references public.categories(id) on delete set null,
  city_id       uuid references public.cities(id) on delete set null,
  filters       jsonb not null default '{}'::jsonb,
  result_count  integer not null default 0,
  -- האם הגולש לחץ על תוצאה. חיפוש בלי קליק = תוצאות לא רלוונטיות.
  clicked_business_id uuid references public.businesses(id) on delete set null,
  clicked_position    smallint,
  visitor_hash  text,
  user_id       uuid references public.profiles(id) on delete set null,
  device        text,
  created_at    timestamptz not null default now()
);

comment on table public.search_queries is
  'המקור לחיפושים חמים, להשלמה אוטומטית, ולזיהוי קטגוריות חסרות (result_count=0).';

create index if not exists search_queries_normalized_idx on public.search_queries(normalized, created_at desc);
create index if not exists search_queries_empty_idx      on public.search_queries(created_at desc) where result_count = 0;
create index if not exists search_queries_date_idx       on public.search_queries(created_at desc);


-- חיפושים חמים, מסוכמים. נבנה בעבודה מתוזמנת מ-search_queries.
-- לא view חי: "מה חם" בעמוד הבית נטען בכל ביקור ואסור לו לסרוק את
-- כל טבלת החיפושים.
create table if not exists public.trending_searches (
  id           uuid primary key default gen_random_uuid(),
  term         text not null,
  href         text,
  search_count integer not null default 0,
  -- מאפשר למנהל לנעוץ מונח ידנית, ללא קשר לנתונים
  is_pinned    boolean not null default false,
  sort_order   integer not null default 0,
  period_start date,
  period_end   date,
  is_active    boolean not null default true
);


-- ============================================================================
-- צפיות בעמודים
-- ============================================================================

create table if not exists public.page_views (
  id            bigserial primary key,
  path          text not null,
  entity_type   text,                      -- 'business' | 'category' | 'article'
  entity_id     uuid,
  referrer      text,
  utm           jsonb not null default '{}'::jsonb,
  device        text,
  country       text,
  visitor_hash  text,
  user_id       uuid references public.profiles(id) on delete set null,
  -- משך שהייה בשניות, נשלח ב-beacon ביציאה
  duration_sec  integer,
  created_at    timestamptz not null default now()
);

create index if not exists page_views_entity_idx on public.page_views(entity_type, entity_id, created_at desc);
create index if not exists page_views_date_idx   on public.page_views(created_at desc);


-- סיכום יומי לעסק — מזין את גרפי לוח הבקרה של בעל העסק
create table if not exists public.business_stats_daily (
  day             date not null,
  business_id     uuid not null references public.businesses(id) on delete cascade,
  views           integer not null default 0,
  unique_visitors integer not null default 0,
  leads           integer not null default 0,
  phone_clicks    integer not null default 0,
  whatsapp_clicks integer not null default 0,
  website_clicks  integer not null default 0,
  direction_clicks integer not null default 0,
  favorites_added integer not null default 0,
  primary key (day, business_id)
);


-- ============================================================================
-- יומן ביקורת
--
-- כל פעולה של צוות נרשמת. before/after מלאים ולא רק "עודכן" —
-- כשמנהל טוען שלא הוא שינה את המחיר, זה מה שעונה על השאלה.
-- ============================================================================

create table if not exists public.audit_logs (
  id           bigserial primary key,
  actor_id     uuid references public.profiles(id) on delete set null,
  actor_email  text,                       -- משוכפל: הפרופיל עשוי להימחק
  action       text not null,              -- 'business.publish', 'settings.update'
  entity_type  text,
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  ip_hash      text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

comment on column public.audit_logs.actor_email is
  'משוכפל בכוונה. יומן ביקורת חייב לשרוד מחיקה של המשתמש שביצע את הפעולה.';

create index if not exists audit_logs_actor_idx  on public.audit_logs(actor_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists audit_logs_date_idx   on public.audit_logs(created_at desc);


-- ============================================================================
-- יומן שגיאות מערכת
-- ============================================================================

create table if not exists public.system_logs (
  id           bigserial primary key,
  level        text not null default 'info' check (level in ('debug', 'info', 'warn', 'error', 'fatal')),
  source       text,                       -- 'api/leads', 'cron/stats'
  message      text not null,
  context      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists system_logs_level_idx on public.system_logs(level, created_at desc);


-- ============================================================================
-- הגבלת קצב
--
-- נשמר ב-DB ולא בזיכרון, כי Next.js על edge/serverless לא מחזיק מצב
-- בין קריאות. חלון מתגלגל פשוט: מונה + חותמת התחלה.
-- ============================================================================

create table if not exists public.rate_limits (
  bucket       text not null,              -- 'lead:<business_id>' | 'review:<ip_hash>'
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (bucket, window_start)
);

create index if not exists rate_limits_window_idx on public.rate_limits(window_start);
