-- ============================================================================
-- 0018 — אזורי שירות, פניות ברמת האתר, ומשבצות פרסום חדשות
--
-- שלושה שינויים שנובעים מהחלטה מוצרית אחת: פנייה לעסק כבר לא נעשית
-- דרך האתר (רק טלפון/וואטסאפ/Waze), ולכן טבלת leads משנה תפקיד —
-- מתיבת פניות לעסקים לתיבת פניות של **האתר**, שאליה נוחתות בין השאר
-- בקשות פרסום. זה מה שמחייב את business_id להיות nullable.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. אזורי שירות לעסק
--
-- טבלת קישור ל-areas ולא מערך טקסט חופשי: האזורים כבר מנורמלים
-- בסכימה (0002), ומערך טקסט היה יוצר "מרכז" ו"אזור המרכז" כשני
-- ערכים שונים שאי אפשר לסנן לפיהם.
-- ----------------------------------------------------------------------------

create table if not exists public.business_service_areas (
  business_id uuid not null references public.businesses(id) on delete cascade,
  area_id     uuid not null references public.areas(id)      on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (business_id, area_id)
);

create index if not exists business_service_areas_area_idx
  on public.business_service_areas(area_id);

comment on table public.business_service_areas is
  'האזורים שבהם העסק נותן שירות. נפרד מ-city_id, שהוא מקום המושב בלבד.';


-- ----------------------------------------------------------------------------
-- 2. leads — פניות ברמת האתר
-- ----------------------------------------------------------------------------

do $$ begin
  create type public.lead_kind as enum (
    'business',    -- פנייה שהופנתה לעסק מסוים (היסטורי — הטופס בוטל)
    'ad_request',  -- בקשה לפרסם באתר
    'contact'      -- פנייה כללית דרך "צור קשר"
  );
exception when duplicate_object then null; end $$;

alter table public.leads
  add column if not exists kind public.lead_kind not null default 'business';

-- פנייה ברמת האתר אינה שייכת לאף עסק. עד כה business_id היה not null,
-- מה שחסם בדיוק את המקרה הזה.
alter table public.leads alter column business_id drop not null;

alter table public.leads
  add column if not exists subject text;

create index if not exists leads_kind_idx on public.leads(kind, created_at desc);

comment on column public.leads.kind is
  'סוג הפנייה. business = היסטורי בלבד; הטופס בדף העסק הוסר לטובת טלפון/וואטסאפ.';
comment on column public.leads.subject is
  'כותרת קצרה שמוצגת ברשימת הפניות בניהול. לבקשת פרסום — שם המפרסם והמיקום המבוקש.';

-- קריאה: פנייה ללא עסק נגישה לצוות בלבד. owns_business(null) מחזיר
-- false, ולכן המדיניות הקיימת כבר נכונה — אבל מנוסחת כאן במפורש
-- כדי שהכוונה תהיה קריאה ולא נסמכת על התנהגות של פונקציה.
drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads
  for select using (
    (business_id is not null and public.owns_business(business_id))
    or public.has_permission('leads.view')
  );

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads
  for update to authenticated
  using (
    (business_id is not null and public.owns_business(business_id))
    or public.has_permission('leads.view')
  )
  with check (
    (business_id is not null and public.owns_business(business_id))
    or public.has_permission('leads.view')
  );


-- ----------------------------------------------------------------------------
-- 3. משבצות פרסום חדשות
--
-- home_cta מחליף את פאנל ה-CTA הכחול בעמוד הבית. categories_top יושב
-- בראש עמוד הקטגוריות. שתיהן מציגות קריאייטיב ברירת מחדל ממותג
-- ("יש לכם מודעה לפרסם?") כשאין באנר פעיל — ההרכבה עצמה באפליקציה,
-- כדי שמשבצת ריקה אף פעם לא תיראה כמו תקלה.
-- ----------------------------------------------------------------------------

insert into public.ad_placements (key, label, description, width, height) values
  ('home_cta', 'באנר רוחב — עמוד הבית',
   'מחליף את פאנל ה-CTA הכחול, מתחת לשורת הקטגוריות. יחס רחב.', 560, 200),
  ('categories_top', 'באנר רוחב — עמוד הקטגוריות',
   'בראש עמוד הקטגוריות, מעל רשת הקטגוריות.', 1200, 200)
on conflict (key) do update
  set label       = excluded.label,
      description = excluded.description,
      width       = excluded.width,
      height      = excluded.height;


-- RLS על הטבלה החדשה. קריאה פומבית (אזורי השירות מוצגים בדף העסק),
-- כתיבה לבעל העסק ולצוות.
alter table public.business_service_areas enable row level security;
alter table public.business_service_areas force row level security;

drop policy if exists business_service_areas_read on public.business_service_areas;
create policy business_service_areas_read on public.business_service_areas
  for select using (true);

drop policy if exists business_service_areas_manage on public.business_service_areas;
create policy business_service_areas_manage on public.business_service_areas
  for all to authenticated
  using (public.owns_business(business_id) or public.has_permission('businesses.manage'))
  with check (public.owns_business(business_id) or public.has_permission('businesses.manage'));
