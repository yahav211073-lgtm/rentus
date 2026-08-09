-- ============================================================================
-- 0009 — Row Level Security
--
-- העיקרון: RLS מופעל על **כל** טבלה, וברירת המחדל היא "אסור".
-- כל גישה נפתחת במפורש. טבלה בלי מדיניות = טבלה נעולה לחלוטין
-- לכל מי שאינו service_role, וזה בדיוק המצב הרצוי כברירת מחדל.
--
-- שלוש קבוצות של גישה:
--   anon           — גולש אנונימי. קורא תוכן פומבי, יוצר ליד/ביקורת.
--   authenticated  — משתמש מחובר. בנוסף: מועדפים, הודעות, העסקים שלו.
--   staff          — לפי has_permission(). ניהול.
--
-- הערה חשובה על ביצועים: כל קריאה ל-auth.uid() בתוך מדיניות
-- מתבצעת לכל שורה. עוטפים אותה ב-(select auth.uid()) כדי
-- ש-Postgres יריץ אותה פעם אחת לשאילתה — זה ההבדל בין שאילתה
-- של 5ms לשאילתה של 500ms על טבלה גדולה.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- הפעלת RLS על כל הטבלאות בסכימה הציבורית
-- ----------------------------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    -- force מחיל RLS גם על בעל הטבלה. בלי זה, חיבור עם תפקיד
    -- הבעלים עוקף בשקט את כל המדיניות.
    execute format('alter table public.%I force row level security', t.tablename);
  end loop;
end $$;


-- ============================================================================
-- פרופילים והרשאות
-- ============================================================================

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (
    id = (select auth.uid()) or public.is_staff()
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- שינוי תפקיד הוא פעולת אדמין בלבד, ולעולם לא דרך עדכון עצמי.
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- טבלאות ההרשאות: קריאה לצוות, כתיבה לאדמין בלבד
do $$
declare t text;
begin
  foreach t in array array['permissions', 'role_permissions', 'user_permissions'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select using (public.is_staff())', t, t);
    execute format('drop policy if exists %I_admin on public.%I', t, t);
    execute format(
      'create policy %I_admin on public.%I for all
         using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;


-- ============================================================================
-- תוכן ציבורי לקריאה
--
-- טקסונומיה, תוכן שיווקי והגדרות ציבוריות — קריאה לכולם,
-- כתיבה רק למי שיש לו את ההרשאה המתאימה.
-- ============================================================================

-- קריאה פומבית לרשומות פעילות.
-- tags לא נכלל כאן — אין בו עמודת is_active, והוא מקבל מדיניות משלו.
do $$
declare t text;
begin
  foreach t in array array['areas', 'cities', 'categories'] loop
    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format(
      'create policy %I_public_read on public.%I for select using (is_active)', t, t);
    execute format('drop policy if exists %I_manage on public.%I', t, t);
    execute format(
      'create policy %I_manage on public.%I for all
         using (public.has_permission(''taxonomy.manage''))
         with check (public.has_permission(''taxonomy.manage''))', t, t);
  end loop;
end $$;

drop policy if exists tags_public_read on public.tags;
create policy tags_public_read on public.tags for select using (true);

drop policy if exists tags_manage on public.tags;
create policy tags_manage on public.tags
  for all using (public.has_permission('taxonomy.manage'))
  with check (public.has_permission('taxonomy.manage'));


-- ============================================================================
-- עסקים
--
-- זו המדיניות הרגישה ביותר במערכת. שלוש דרכים לראות עסק:
--   · הוא published — כולם
--   · אני הבעלים — בכל סטטוס
--   · יש לי הרשאת ניהול עסקים
-- ============================================================================

drop policy if exists businesses_public_read on public.businesses;
create policy businesses_public_read on public.businesses
  for select using (
    status = 'published'
    or owner_id = (select auth.uid())
    or public.has_permission('businesses.manage')
  );

-- בעל עסק יוצר עסק על שמו בלבד. בלי ה-with check הזה אפשר היה
-- ליצור עסק ולשייך אותו למשתמש אחר.
drop policy if exists businesses_insert_own on public.businesses;
create policy businesses_insert_own on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists businesses_update_own on public.businesses;
create policy businesses_update_own on public.businesses
  for update using (
    owner_id = (select auth.uid()) or public.has_permission('businesses.manage')
  )
  with check (
    owner_id = (select auth.uid()) or public.has_permission('businesses.manage')
  );

drop policy if exists businesses_delete_staff on public.businesses;
create policy businesses_delete_staff on public.businesses
  for delete using (public.has_permission('businesses.manage'));


-- ----------------------------------------------------------------------------
-- טבלאות תלויות-עסק.
--
-- כולן חולקות את אותו כלל: מותר לקרוא אם העסק גלוי, ומותר לכתוב
-- אם אני הבעלים או מנהל. הפונקציה מרכזת את זה כדי שלא נשכפל
-- את אותה תת-שאילתה בשמונה מקומות ונטעה באחד מהם.
-- ----------------------------------------------------------------------------

create or replace function public.owns_business(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = bid and owner_id = auth.uid()
  );
$$;

create or replace function public.business_is_visible(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = bid
      and (status = 'published' or owner_id = auth.uid())
  );
$$;


do $$
declare t text;
begin
  foreach t in array array[
    'business_categories', 'business_tags', 'business_hours',
    'business_hour_overrides', 'business_services', 'media'
  ] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select
         using (public.business_is_visible(business_id)
                or public.has_permission(''businesses.manage''))', t, t);

    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_write on public.%I for all to authenticated
         using (public.owns_business(business_id)
                or public.has_permission(''businesses.manage''))
         with check (public.owns_business(business_id)
                or public.has_permission(''businesses.manage''))', t, t);
  end loop;
end $$;

-- media.business_id יכול להיות null (מדיה כללית של האתר)
drop policy if exists media_read on public.media;
create policy media_read on public.media
  for select using (
    business_id is null
    or public.business_is_visible(business_id)
    or public.has_permission('businesses.manage')
  );


-- בקשות בעלות
drop policy if exists claims_own on public.business_claims;
create policy claims_own on public.business_claims
  for select using (
    user_id = (select auth.uid()) or public.has_permission('businesses.manage')
  );

drop policy if exists claims_create on public.business_claims;
create policy claims_create on public.business_claims
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists claims_review on public.business_claims;
create policy claims_review on public.business_claims
  for update using (public.has_permission('businesses.manage'))
  with check (public.has_permission('businesses.manage'));


-- ============================================================================
-- ביקורות
--
-- קריאה: רק מאושרות, פלוס שלי שלי, פלוס הכל למנהלים.
-- כתיבה: כל אחד יכול ליצור (עובר מודרציה), אבל אף אחד לא יכול
--        ליצור ביקורת עם status='approved'. זה נאכף ב-with check.
-- ============================================================================

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select using (
    status = 'approved'
    or user_id = (select auth.uid())
    or public.owns_business(business_id)
    or public.has_permission('reviews.moderate')
  );

-- הנקודה הקריטית: status חייב להיות 'pending' ביצירה.
-- בלי זה כל אחד היה יכול לפרסם ביקורת מאושרת ולעקוף מודרציה.
drop policy if exists reviews_create on public.reviews;
create policy reviews_create on public.reviews
  for insert
  with check (
    status = 'pending'
    and (user_id is null or user_id = (select auth.uid()))
  );

-- עריכת ביקורת משלי מחזירה אותה למודרציה
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists reviews_moderate on public.reviews;
create policy reviews_moderate on public.reviews
  for all
  using (public.has_permission('reviews.moderate'))
  with check (public.has_permission('reviews.moderate'));

-- תשובת בעל העסק: עדכון owner_reply בלבד.
-- ההגבלה לעמודה עצמה נאכפת ב-GRANT בהמשך הקובץ.
drop policy if exists reviews_owner_reply on public.reviews;
create policy reviews_owner_reply on public.reviews
  for update to authenticated
  using (public.owns_business(business_id))
  with check (public.owns_business(business_id));


drop policy if exists review_votes_own on public.review_votes;
create policy review_votes_own on public.review_votes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists review_reports_create on public.review_reports;
create policy review_reports_create on public.review_reports
  for insert with check (true);

drop policy if exists review_reports_read on public.review_reports;
create policy review_reports_read on public.review_reports
  for select using (public.has_permission('reviews.moderate'));


-- ============================================================================
-- מועדפים, פניות, הודעות, התראות
-- ============================================================================

drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- פניות: יצירה פתוחה לכולם (זה טופס ציבורי), קריאה סגורה לחלוטין.
-- זו נקודה שקל לפספס — רשימת הלידים של עסק היא נכס מסחרי.
drop policy if exists leads_create on public.leads;
create policy leads_create on public.leads
  for insert with check (true);

drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads
  for select using (
    public.owns_business(business_id) or public.has_permission('leads.view')
  );

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads
  for update to authenticated
  using (public.owns_business(business_id) or public.has_permission('leads.view'))
  with check (public.owns_business(business_id) or public.has_permission('leads.view'));


drop policy if exists conversations_participant on public.conversations;
create policy conversations_participant on public.conversations
  for all to authenticated
  using (user_id = (select auth.uid()) or public.owns_business(business_id))
  with check (user_id = (select auth.uid()) or public.owns_business(business_id));

drop policy if exists messages_participant on public.messages;
create policy messages_participant on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_id = (select auth.uid()) or public.owns_business(c.business_id))
    )
  );

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_id = (select auth.uid()) or public.owns_business(c.business_id))
    )
  );


drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- ניוזלטר: הרשמה פתוחה, רשימת הנרשמים סגורה.
drop policy if exists newsletter_subscribe on public.newsletter_subscribers;
create policy newsletter_subscribe on public.newsletter_subscribers
  for insert with check (true);

drop policy if exists newsletter_read on public.newsletter_subscribers;
create policy newsletter_read on public.newsletter_subscribers
  for select using (public.has_permission('newsletter.manage'));


-- ============================================================================
-- CMS
-- ============================================================================

drop policy if exists homepage_sections_read on public.homepage_sections;
create policy homepage_sections_read on public.homepage_sections
  for select using (is_active or public.has_permission('content.manage'));

drop policy if exists homepage_sections_manage on public.homepage_sections;
create policy homepage_sections_manage on public.homepage_sections
  for all using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));

do $$
declare t text;
begin
  foreach t in array array['menus', 'menu_items', 'testimonials', 'partners',
                           'article_categories', 'trending_searches'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (true)', t, t);
    execute format('drop policy if exists %I_manage on public.%I', t, t);
    execute format(
      'create policy %I_manage on public.%I for all
         using (public.has_permission(''content.manage''))
         with check (public.has_permission(''content.manage''))', t, t);
  end loop;
end $$;

-- עמודים ומאמרים: רק published גלוי לציבור
do $$
declare t text;
begin
  foreach t in array array['pages', 'articles'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select
         using (status = ''published'' or public.has_permission(''content.manage''))', t, t);
    execute format('drop policy if exists %I_manage on public.%I', t, t);
    execute format(
      'create policy %I_manage on public.%I for all
         using (public.has_permission(''content.manage''))
         with check (public.has_permission(''content.manage''))', t, t);
  end loop;
end $$;

drop policy if exists faq_read on public.faq;
create policy faq_read on public.faq for select using (is_active);

drop policy if exists faq_manage on public.faq;
create policy faq_manage on public.faq
  for all using (public.has_permission('content.manage'))
  with check (public.has_permission('content.manage'));


-- הגדרות: רק המפתחות הציבוריים נחשפים. סודות נשארים בפנים.
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select using (is_public or public.has_permission('settings.manage'));

drop policy if exists settings_manage on public.settings;
create policy settings_manage on public.settings
  for all using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));

drop policy if exists feature_flags_read on public.feature_flags;
create policy feature_flags_read on public.feature_flags for select using (true);

drop policy if exists feature_flags_manage on public.feature_flags;
create policy feature_flags_manage on public.feature_flags
  for all using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['seo_overrides', 'redirects'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (true)', t, t);
    execute format('drop policy if exists %I_manage on public.%I', t, t);
    execute format(
      'create policy %I_manage on public.%I for all
         using (public.has_permission(''seo.manage''))
         with check (public.has_permission(''seo.manage''))', t, t);
  end loop;
end $$;


-- ============================================================================
-- פרסום
--
-- הבאנרים והפופאפים עצמם נקראים על ידי כולם (צריך להציג אותם).
-- אירועי המדידה — כתיבה דרך service_role בלבד, כדי שאי אפשר יהיה
-- לנפח CTR של מתחרה מהקונסול.
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array['ad_placements', 'banners', 'popup_banners'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (true)', t, t);
    execute format('drop policy if exists %I_manage on public.%I', t, t);
    execute format(
      'create policy %I_manage on public.%I for all
         using (public.has_permission(''ads.manage''))
         with check (public.has_permission(''ads.manage''))', t, t);
  end loop;
end $$;

drop policy if exists coupons_read on public.coupons;
create policy coupons_read on public.coupons
  for select using (
    is_active or public.owns_business(business_id) or public.has_permission('ads.manage')
  );

drop policy if exists coupons_manage on public.coupons;
create policy coupons_manage on public.coupons
  for all to authenticated
  using (public.owns_business(business_id) or public.has_permission('ads.manage'))
  with check (public.owns_business(business_id) or public.has_permission('ads.manage'));

-- אירועים וסטטיסטיקות: קריאה למנהלים בלבד, כתיבה רק service_role
-- (אין policy ל-insert = אין דרך לכתוב מהלקוח).
do $$
declare t text;
begin
  foreach t in array array['ad_events', 'ad_stats_daily', 'popup_views'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select
         using (public.has_permission(''ads.manage''))', t, t);
  end loop;
end $$;


-- ============================================================================
-- חיוב
-- ============================================================================

drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select using (is_active);

drop policy if exists plans_manage on public.plans;
create policy plans_manage on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions
  for select using (
    public.owns_business(business_id) or public.has_permission('billing.view')
  );

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
  for select using (
    public.owns_business(business_id) or public.has_permission('billing.view')
  );

-- כתיבה למנויים ולתשלומים — service_role בלבד, מתוך webhook של
-- ספק הסליקה. אין policy ל-insert/update בכוונה.


-- ============================================================================
-- אנליטיקס ויומנים
-- ============================================================================

drop policy if exists search_queries_insert on public.search_queries;
create policy search_queries_insert on public.search_queries
  for insert with check (true);

drop policy if exists search_queries_read on public.search_queries;
create policy search_queries_read on public.search_queries
  for select using (public.has_permission('analytics.view'));

drop policy if exists page_views_insert on public.page_views;
create policy page_views_insert on public.page_views
  for insert with check (true);

drop policy if exists page_views_read on public.page_views;
create policy page_views_read on public.page_views
  for select using (public.has_permission('analytics.view'));

drop policy if exists business_stats_read on public.business_stats_daily;
create policy business_stats_read on public.business_stats_daily
  for select using (
    public.owns_business(business_id) or public.has_permission('analytics.view')
  );

-- יומן ביקורת: קריאה לאדמין בלבד, ואין דרך לכתוב או למחוק מהלקוח.
-- יומן שאפשר לערוך הוא לא יומן.
drop policy if exists audit_logs_read on public.audit_logs;
create policy audit_logs_read on public.audit_logs
  for select using (public.is_admin());

drop policy if exists system_logs_read on public.system_logs;
create policy system_logs_read on public.system_logs
  for select using (public.is_admin());

-- rate_limits — service_role בלבד. אין policy כלל.


-- ============================================================================
-- הרשאות ברמת העמודה
--
-- RLS שולט בשורות. GRANT שולט בעמודות. בעל עסק שיכול לעדכן
-- שורת ביקורת חייב להיות מוגבל לעמודות התשובה בלבד — אחרת הוא
-- יכול לשנות את הדירוג שקיבל.
-- ============================================================================

revoke update on public.reviews from authenticated;
grant update (owner_reply, owner_replied_at) on public.reviews to authenticated;

-- בעל עסק לא משנה בעצמו את הסטטוס, את ה-tier או את סימוני הקידום.
revoke update on public.businesses from authenticated;
grant update (
  name, tagline, description, founded_year,
  city_id, area_id, address, address_note, latitude, longitude,
  is_mobile_service, service_radius_km,
  phone, phone_secondary, whatsapp, email, website, social,
  logo_url, cover_url, video_url,
  price_range, price_note, accepts_online_booking,
  seo_title, seo_description
) on public.businesses to authenticated;

comment on table public.businesses is
  'בעל עסק מעדכן רק עמודות תוכן. status, tier, is_featured ו-boost_score
   שמורים לצוות — ראו את ה-GRANT ב-0009_rls.sql.';
