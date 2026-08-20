-- ============================================================================
-- 0019 — פניות שאינן מופנות לעסק
--
-- הבאג: טופס "בקשה לפרסום באתר" (AdRequestForm) וטופס יצירת קשר שולחים
-- ל-/api/leads בלי business_id, ונכשלים. זה לא באג בקוד הטופס אלא במבנה:
--
--   business_id uuid not null references public.businesses(id)
--
-- כלומר פנייה כללית לאתר לא יכולה להישמר בטבלה הזו בכלל. הטופס נבנה
-- למצב שהמסד מעולם לא תמך בו.
--
-- התיקון: business_id הופך ל-nullable, ומתווסף kind שמבדיל בין סוגי
-- הפניות. עמודה ולא טבלה נפרדת — טבלת "פניות אתר" נפרדת הייתה מחייבת
-- שכפול של כל שדות הקשר ומסך ניהול שני, וזו בדיוק הכפילות שגורמת
-- לנתונים להתפצל ולניהול להציג משהו אחר מהאתר.
-- ============================================================================

alter table public.leads
  alter column business_id drop not null;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_kind') then
    create type public.lead_kind as enum ('business', 'contact', 'ad_request');
  end if;
end $$;

alter table public.leads
  add column if not exists kind public.lead_kind not null default 'business',
  add column if not exists subject text;

comment on column public.leads.business_id is
  'null = פנייה כללית לאתר (יצירת קשר / בקשת פרסום). ראו kind.';
comment on column public.leads.kind is
  'business = פנייה לעסק ספציפי. contact / ad_request = פנייה להנהלת האתר.';

create index if not exists leads_kind_idx on public.leads(kind, created_at desc);


-- ----------------------------------------------------------------------------
-- מדיניות קריאה
--
-- leads_read הקיימת נשענת על owns_business(business_id). כש-business_id
-- הוא null הפונקציה מחזירה false, ולכן פניות האתר היו נעלמות מכל מסך —
-- כולל מהניהול. מוסיפים במפורש: פנייה בלי עסק נראית למי שיש לו
-- leads.view, כלומר לצוות בלבד.
-- ----------------------------------------------------------------------------
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
