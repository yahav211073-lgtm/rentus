-- ============================================================================
-- 0015 — מודרציית ביקורות אתר, ביקורות למחוברים בלבד, וניקוי נתונים שבורים
--
-- שלושה דברים נפרדים שנוגעים באותה בעיה: תוכן שנכנס למסד אבל לא
-- מגיע לאתר, או מגיע אליו בלי שאושר.
--
-- 1. testimonials — הטבלה נבנתה ב-0005 כתוכן עורכי בלבד (is_active).
--    עכשיו היא גם תיבת ביקורות של הפלטפורמה, ולכן היא צריכה בדיוק
--    את אותה מכונת מודרציה שיש ל-reviews: status עם ברירת מחדל
--    'pending', ואיסור מוחלט ליצור שורה 'approved' מהצד.
--
-- 2. reviews — ביקורת דורשת חשבון. עד היום user_id יכול היה להיות
--    null (ביקורת אנונימית). זו החלטת מוצר, ולכן היא נאכפת ב-DB
--    ולא רק בטופס: טופס אפשר לעקוף.
--
-- 3. נתונים שבורים — הטפסים בניהול קיבלו כתובת תמונה כטקסט חופשי,
--    ולתוכם הודבקו נתיבי `file:///` מקומיים. הם נשמרו תקין במסד,
--    ולכן "הפעולה הצליחה" בניהול — אבל בדפדפן של הגולש אין להם
--    שום משמעות. מנקים אותם כאן, וחוסמים אותם בקוד (lib/uploads.ts).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. ביקורות על הפלטפורמה
-- ----------------------------------------------------------------------------

alter table public.testimonials
  add column if not exists status       text not null default 'pending',
  add column if not exists user_id      uuid references public.profiles(id) on delete set null,
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null,
  add column if not exists moderated_at timestamptz,
  add column if not exists updated_at   timestamptz not null default now();

alter table public.testimonials drop constraint if exists testimonials_status_check;
alter table public.testimonials add constraint testimonials_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- שורות שהוזנו ידנית לפני שהייתה מודרציה נחשבות מאושרות: הן נכתבו
-- על ידי מנהל, לא הוגשו מהאתר.
update public.testimonials set status = 'approved' where status = 'pending' and user_id is null;

create index if not exists testimonials_status_idx
  on public.testimonials(status, sort_order, created_at desc);

drop trigger if exists testimonials_touch on public.testimonials;
create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();

-- קריאה ציבורית: רק מאושר **וגם** פעיל. שתי הבקרות נשארות עצמאיות —
-- is_active הוא "הסתר זמנית" של מנהל, status הוא תוצאת המודרציה.
drop policy if exists testimonials_read on public.testimonials;
create policy testimonials_read on public.testimonials
  for select using (
    (status = 'approved' and is_active)
    or user_id = (select auth.uid())
    or public.has_permission('content.manage')
  );

-- הגשה: רק משתמש מחובר, רק על עצמו, ותמיד ל-pending.
drop policy if exists testimonials_create on public.testimonials;
create policy testimonials_create on public.testimonials
  for insert to authenticated
  with check (status = 'pending' and user_id = (select auth.uid()));

drop policy if exists testimonials_manage on public.testimonials;
create policy testimonials_manage on public.testimonials
  for all using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));


-- ----------------------------------------------------------------------------
-- 2. ביקורת עסק דורשת חשבון
--
-- reviews_create ב-0009 אפשרה user_id null. מחליפים את התנאי כך
-- שהוא מחייב התאמה לסשן — anon לא מחזיק auth.uid() ולכן נחסם.
-- ----------------------------------------------------------------------------

drop policy if exists reviews_create on public.reviews;
create policy reviews_create on public.reviews
  for insert to authenticated
  with check (
    status = 'pending'
    and user_id = (select auth.uid())
  );


-- ----------------------------------------------------------------------------
-- 3. ניקוי כתובות תמונה שאינן ניתנות לטעינה בדפדפן
--
-- כל מה שאינו http/https או data: הוא כתובת שלא תיטען אצל אף גולש.
-- באנר כזה מושבת (ולא נמחק) כדי שהמנהל יראה אותו ויעלה תמונה אמיתית.
-- ----------------------------------------------------------------------------

create or replace function public.is_web_url(u text)
returns boolean
language sql immutable
as $$ select u is null or u ~ '^(https?://|/)' $$;

comment on function public.is_web_url is
  'כתובת שדפדפן באמת יכול לטעון. file:/// ונתיבים מקומיים נופלים כאן.';

update public.banners
set asset_url = null,
    asset_url_mobile = null,
    is_active = false
where not public.is_web_url(asset_url)
   or not public.is_web_url(asset_url_mobile);

update public.banners
set href = null
where not public.is_web_url(href);

update public.popup_banners
set asset_url = null, is_active = false
where not public.is_web_url(asset_url);

update public.categories
set image_url = null
where not public.is_web_url(image_url);

update public.businesses
set logo_url = case when public.is_web_url(logo_url) then logo_url end,
    cover_url = case when public.is_web_url(cover_url) then cover_url end
where not public.is_web_url(logo_url) or not public.is_web_url(cover_url);

-- brand.identity.logoUrl יושב ב-JSON ולכן לא נתפס על ידי העדכונים למעלה
update public.settings
set value = jsonb_set(value, '{logoUrl}', 'null'::jsonb),
    updated_at = now()
where key = 'brand.identity'
  and not public.is_web_url(value->>'logoUrl');


-- ----------------------------------------------------------------------------
-- 4. קטגוריות מאמרים בסיסיות
--
-- בלי לפחות קטגוריה אחת, טופס יצירת המאמר בניהול היה מציג בחירה ריקה.
-- ----------------------------------------------------------------------------

insert into public.article_categories (slug, name, sort_order) values
  ('madrichim',  'מדריכים',       10),
  ('tips',       'טיפים',         20),
  ('hashvaot',   'השוואות',       30),
  ('hadashot',   'חדשות הענף',    40)
on conflict (slug) do nothing;
