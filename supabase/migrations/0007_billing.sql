-- ============================================================================
-- 0007 — חיוב: מסלולים, מנויים, תשלומים
--
-- הערה על כסף: אנחנו לא מאחסנים פרטי אמצעי תשלום. הכל דרך ספק סליקה
-- (Stripe / Tranzila / Cardcom), ומה שנשמר כאן הוא רק המזהה החיצוני
-- והתוצאה. amount_cents ולא numeric — חישובי כסף בנקודה צפה הם באג
-- שמחכה לקרות.
-- ============================================================================

create table if not exists public.plans (
  id             uuid primary key default gen_random_uuid(),
  key            text unique not null,     -- 'free' | 'basic' | 'premium' | 'enterprise'
  name           text not null,
  tagline        text,
  tier           public.business_tier not null default 'free',

  price_cents_monthly integer not null default 0,
  price_cents_yearly  integer not null default 0,
  currency       text not null default 'ILS',

  -- מגבלות המסלול. null בתוך ה-JSON = ללא הגבלה.
  -- {gallery_images: 10, services: 5, categories: 2, leads_per_month: null,
  --  featured: false, sponsored: false, analytics: 'basic', video: false}
  limits         jsonb not null default '{}'::jsonb,
  -- רשימת התכונות כפי שהיא מוצגת בעמוד התמחור
  features       text[] not null default '{}',

  is_popular     boolean not null default false,   -- התג "הכי משתלם"
  is_active      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.plans.limits is
  'מגבלות שנאכפות באפליקציה. null בתוך ה-JSON = ללא הגבלה, להבדיל מ-0.';


do $$ begin
  create type public.subscription_status as enum (
    'trialing', 'active', 'past_due', 'canceled', 'expired'
  );
exception when duplicate_object then null; end $$;


create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  plan_id         uuid not null references public.plans(id) on delete restrict,
  status          public.subscription_status not null default 'trialing',
  billing_cycle   text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),

  -- מזהה אצל ספק הסליקה. זה מקור האמת לחיוב עצמו.
  provider        text,
  provider_sub_id text,

  trial_ends_at   timestamptz,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at     timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists subscriptions_business_idx on public.subscriptions(business_id, status);
create index if not exists subscriptions_period_idx   on public.subscriptions(current_period_end) where status = 'active';

-- מנוי פעיל אחד לעסק. היסטוריה נשמרת בשורות שאינן פעילות.
create unique index if not exists subscriptions_one_active
  on public.subscriptions(business_id) where status in ('trialing', 'active', 'past_due');


create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  business_id     uuid references public.businesses(id) on delete set null,

  amount_cents    integer not null,
  currency        text not null default 'ILS',
  status          text not null default 'pending'
                  check (status in ('pending', 'paid', 'failed', 'refunded')),

  provider        text,
  provider_payment_id text,
  invoice_url     text,
  -- 4 ספרות אחרונות בלבד, לזיהוי ויזואלי. שום דבר מעבר לזה לא נשמר.
  card_last4      text,
  failure_reason  text,

  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

comment on column public.payments.card_last4 is
  '4 ספרות אחרונות בלבד, לתצוגה. פרטי אשראי מלאים לעולם לא עוברים דרך המערכת.';

create index if not exists payments_business_idx on public.payments(business_id, created_at desc);


do $$
declare t text;
begin
  foreach t in array array['plans', 'subscriptions'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
