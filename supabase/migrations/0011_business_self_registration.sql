-- ============================================================================
-- 0011 — הרשמת עסק עצמאית
--
-- ב-0009 מדיניות ה-insert העצמית לעסק (businesses_insert_own) בדקה רק
-- owner_id = עצמי, בלי הגבלה על status — כלומר טכנית ניתן היה להכניס
-- עסק ישר כ-published דרך ה-SDK של הלקוח, עוקף לגמרי את אישור המנהל.
-- כאן: מגבילים הרשמה עצמית ל-draft/pending, ומוסיפים מדיניות נפרדת
-- לצוות שיכול להכניס עסק בכל סטטוס (הוספה ידנית מהאדמין).
-- ============================================================================

drop policy if exists businesses_insert_own on public.businesses;
create policy businesses_insert_own on public.businesses
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status in ('draft', 'pending')
  );

drop policy if exists businesses_insert_staff on public.businesses;
create policy businesses_insert_staff on public.businesses
  for insert to authenticated
  with check (public.has_permission('businesses.manage'));


-- ============================================================================
-- מספר וואטסאפ ברירת מחדל ליצירת קשר
--
-- contact.details כבר קיים מ-0010 עם whatsapp ריק. ממלאים placeholder
-- שאפשר לשנות מ-/admin/settings בלי לגעת ב-DB.
-- ============================================================================

update public.settings
set value = jsonb_set(value, '{whatsapp}', '"972500000000"'),
    updated_at = now()
where key = 'contact.details'
  and coalesce(value->>'whatsapp', '') = '';
