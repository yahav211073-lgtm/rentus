-- ============================================================================
-- 0004 — מעורבות: ביקורות, מועדפים, פניות, התראות
-- ============================================================================


-- ============================================================================
-- ביקורות
--
-- דירוגי משנה (איכות / שירות / מחיר) הם אופציונליים. rating הכללי הוא
-- החובה היחידה — דרישת ארבעה ציונים מורידה דרמטית את שיעור השלמת הטופס.
-- ============================================================================

do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'rejected', 'spam');
exception when duplicate_object then null; end $$;


create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  user_id        uuid references public.profiles(id) on delete set null,

  -- שם ואימייל למי שמשאיר ביקורת בלי להירשם. עדיין עובר מודרציה.
  author_name    text,
  author_email   citext,

  rating         smallint not null check (rating between 1 and 5),
  rating_quality smallint check (rating_quality between 1 and 5),
  rating_service smallint check (rating_service between 1 and 5),
  rating_value   smallint check (rating_value   between 1 and 5),

  title          text,
  body           text,
  status         public.review_status not null default 'pending',

  -- תשובת בעל העסק. שדה אחד ולא טבלת תגובות — בפועל יש בדיוק תשובה אחת,
  -- וטבלה נפרדת רק מוסיפה join לכל טעינת עמוד.
  owner_reply    text,
  owner_replied_at timestamptz,

  helpful_count  integer not null default 0,
  moderated_by   uuid references public.profiles(id) on delete set null,
  moderated_at   timestamptz,
  ip_hash        text,                     -- hash בלבד, לזיהוי ספאם. לא ה-IP עצמו.
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.reviews.ip_hash is
  'hash חד-כיווני. מספיק לזיהוי הצפה מאותו מקור, בלי לאחסן מידע מזהה.';

create index if not exists reviews_business_idx on public.reviews(business_id, status);
create index if not exists reviews_user_idx     on public.reviews(user_id);
create index if not exists reviews_created_idx  on public.reviews(created_at desc);

-- משתמש רשום — ביקורת אחת לעסק. אנונימיים לא נכללים באילוץ.
create unique index if not exists reviews_one_per_user
  on public.reviews(business_id, user_id) where user_id is not null;


-- ----------------------------------------------------------------------------
-- תחזוקת הדירוג המנורמל-לאחור.
-- רץ אחרי כל שינוי בביקורות ומעדכן את שורת העסק.
-- סופר רק ביקורות מאושרות — ביקורת ממתינה לא אמורה להזיז את הציון.
-- ----------------------------------------------------------------------------

create or replace function public.recalc_business_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.business_id, old.business_id);
begin
  update public.businesses b
  set rating_avg = coalesce(agg.avg_rating, 0),
      review_count = coalesce(agg.cnt, 0)
  from (
    select round(avg(rating)::numeric, 1) as avg_rating, count(*) as cnt
    from public.reviews
    where business_id = target and status = 'approved'
  ) agg
  where b.id = target;

  return null;
end;
$$;

drop trigger if exists reviews_recalc_rating on public.reviews;
create trigger reviews_recalc_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_business_rating();


-- הצבעות "מועיל". טבלה ולא מונה, אחרת אי אפשר למנוע הצבעה כפולה.
create table if not exists public.review_votes (
  review_id   uuid not null references public.reviews(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (review_id, user_id)
);


-- דיווח על ביקורת פוגענית
create table if not exists public.review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  details     text,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);


-- ============================================================================
-- מועדפים
-- ============================================================================

create table if not exists public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, business_id)
);

create index if not exists favorites_business_idx on public.favorites(business_id);


-- ============================================================================
-- פניות (לידים)
--
-- זה המוצר האמיתי של אינדקס עסקים. הכל כאן נועד לשרת שאלה אחת:
-- כמה פניות קיבל בעל העסק, ומה קרה איתן.
-- ============================================================================

do $$ begin
  create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost', 'spam');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_channel as enum ('form', 'phone', 'whatsapp', 'email', 'website_click');
exception when duplicate_object then null; end $$;


create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete set null,

  name          text,
  phone         text,
  email         citext,
  message       text,
  -- שדות דינמיים לפי קטגוריה: תאריך אירוע, מספר מוזמנים, סוג נכס...
  extra         jsonb not null default '{}'::jsonb,

  channel       public.lead_channel not null default 'form',
  status        public.lead_status  not null default 'new',
  owner_note    text,

  -- ייחוס: מאיפה הגיעה הפנייה. עמוד הבית? חיפוש? עמוד קטגוריה?
  source_page   text,
  utm           jsonb not null default '{}'::jsonb,

  contacted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.leads.extra is
  'שדות טופס דינמיים לפי קטגוריה. הסכימה שלהם נשמרת ב-categories ומורכבת באפליקציה.';

create index if not exists leads_business_idx on public.leads(business_id, status, created_at desc);
create index if not exists leads_created_idx  on public.leads(created_at desc);


-- ============================================================================
-- הודעות בין משתמש לעסק
-- ============================================================================

create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  attachments     jsonb not null default '[]'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);


-- ============================================================================
-- התראות
-- ============================================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,               -- 'lead.new', 'review.new', 'business.approved'
  title       text not null,
  body        text,
  link        text,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, read_at, created_at desc);


-- ============================================================================
-- ניוזלטר
-- ============================================================================

create table if not exists public.newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          citext unique not null,
  full_name      text,
  -- אישור כפול. בלי confirmed_at לא שולחים — דרישת חוק הספאם.
  confirmed_at   timestamptz,
  confirm_token  uuid not null default gen_random_uuid(),
  unsubscribed_at timestamptz,
  source         text,
  created_at     timestamptz not null default now()
);


do $$
declare t text;
begin
  foreach t in array array['reviews', 'leads'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
