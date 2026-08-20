-- ============================================================================
-- 0010 — נתוני ייחוס
--
-- כאן יושב רק מה שהמערכת לא יכולה לתפקד בלעדיו: רשימת ההרשאות,
-- שיוכן לתפקידים, מיקומי הפרסום, מסלולי המנוי, ומבנה עמוד הבית.
--
-- זה **לא** תוכן הדגמה. אין כאן עסקים בדיוניים ולא ביקורות מומצאות —
-- אלה יושבים ב-src/data/seed.ts ומשמשים רק כשאין חיבור למסד נתונים.
-- הקובץ הזה בטוח להרצה בפרודקשן.
-- ============================================================================


-- ============================================================================
-- הרשאות
-- ============================================================================

insert into public.permissions (key, group_name, label, description) values
  ('businesses.manage',  'עסקים',   'ניהול עסקים',        'יצירה, עריכה, אישור והשעיה של כל עסק'),
  ('businesses.publish', 'עסקים',   'פרסום עסקים',        'העברת עסק מסטטוס ממתין לפורסם'),
  ('reviews.moderate',   'ביקורות', 'מודרציית ביקורות',   'אישור, דחייה ומחיקה של ביקורות'),
  ('leads.view',         'פניות',   'צפייה בכל הפניות',   'גישה לפניות של כל העסקים'),
  ('taxonomy.manage',    'תוכן',    'ניהול טקסונומיה',    'קטגוריות, ערים, אזורים ותגיות'),
  ('content.manage',     'תוכן',    'ניהול תוכן',         'עמודים, מאמרים, שאלות נפוצות ועמוד הבית'),
  ('seo.manage',         'תוכן',    'ניהול SEO',          'דריסות מטא-דאטה והפניות'),
  ('ads.manage',         'פרסום',   'ניהול פרסום',        'באנרים, פופאפים, קופונים ודוחות CTR'),
  ('newsletter.manage',  'שיווק',   'ניהול ניוזלטר',      'צפייה ברשימת הנרשמים וייצוא'),
  ('analytics.view',     'נתונים',  'צפייה באנליטיקס',    'חיפושים, צפיות ודוחות'),
  ('billing.view',       'כספים',   'צפייה בחיובים',      'מנויים, תשלומים וחשבוניות'),
  ('settings.manage',    'מערכת',   'ניהול הגדרות',       'הגדרות מערכת, מיתוג ודגלי פיצ׳ר'),
  ('users.manage',       'מערכת',   'ניהול משתמשים',      'תפקידים והרשאות')
on conflict (key) do update
  set group_name = excluded.group_name,
      label = excluded.label,
      description = excluded.description;


-- שיוך הרשאות לתפקידים.
-- admin לא מופיע כאן במכוון — is_admin() עוקף את הבדיקה ממילא,
-- ורשימה מפורשת עבורו רק תיצור מצב שבו מחיקה בטעות נועלת את
-- המערכת מבחוץ.
insert into public.role_permissions (role, permission_key) values
  -- מנהל תוכן ומודרטור
  ('moderator', 'businesses.manage'),
  ('moderator', 'businesses.publish'),
  ('moderator', 'reviews.moderate'),
  ('moderator', 'leads.view'),
  ('moderator', 'analytics.view'),
  -- עורך: תוכן ו-SEO בלבד
  ('editor', 'content.manage'),
  ('editor', 'taxonomy.manage'),
  ('editor', 'seo.manage'),
  ('editor', 'analytics.view')
on conflict do nothing;


-- ============================================================================
-- מיקומי פרסום
-- ============================================================================

insert into public.ad_placements (key, label, description, width, height) values
  ('side_start',     'באנר צדדי — ימין',  'צף ודביק. מוצג רק ממסכים רחבים מ-1600px.', 160, 500),
  ('side_end',       'באנר צדדי — שמאל',  'צף ודביק. מוצג רק ממסכים רחבים מ-1600px.', 160, 500),

on conflict (key) do update
  set label = excluded.label, description = excluded.description;


-- ============================================================================
-- מסלולי מנוי
-- ============================================================================

insert into public.plans (key, name, tagline, tier, price_cents_monthly, price_cents_yearly, limits, features, is_popular, sort_order) values
  (
    'free', 'בסיסי', 'להתחיל להופיע', 'free', 0, 0,
    '{"gallery_images": 5, "services": 3, "categories": 1, "video": false, "featured": false, "sponsored": false, "analytics": "basic"}'::jsonb,
    array['פרופיל עסק מלא', 'עד 5 תמונות בגלריה', 'שעות פעילות ופרטי קשר', 'קבלת פניות', 'עד 3 שירותים'],
    false, 1
  ),
  (
    'basic', 'מתקדם', 'להיראות טוב יותר', 'basic', 14900, 149000,
    '{"gallery_images": 20, "services": 10, "categories": 2, "video": false, "featured": false, "sponsored": false, "analytics": "standard"}'::jsonb,
    array['כל מה שבבסיסי', 'עד 20 תמונות', 'שתי קטגוריות', 'תג עסק מאומת', 'דוח פניות חודשי', 'תשובה לביקורות'],
    false, 2
  ),
  (
    'premium', 'פרימיום', 'להופיע ראשונים', 'premium', 34900, 349000,
    '{"gallery_images": 60, "services": null, "categories": 4, "video": true, "featured": true, "sponsored": false, "analytics": "full"}'::jsonb,
    array['כל מה שבמתקדם', 'גלריה ללא הגבלה מעשית', 'סרטון תדמית', 'בליטה בתוצאות החיפוש', 'הופעה ברצועת המומלצים', 'ניתוח פניות מלא', 'ארבע קטגוריות'],
    true, 3
  ),
  (
    'enterprise', 'עסקי', 'לרשתות ולריבוי סניפים', 'enterprise', 89900, 899000,
    '{"gallery_images": null, "services": null, "categories": null, "video": true, "featured": true, "sponsored": true, "analytics": "full"}'::jsonb,
    array['כל מה שבפרימיום', 'ריבוי סניפים תחת חשבון אחד', 'קידום ממומן', 'מנהל לקוח ייעודי', 'API לסנכרון נתונים', 'דוחות מותאמים'],
    false, 4
  )
on conflict (key) do update
  set name = excluded.name,
      tagline = excluded.tagline,
      limits = excluded.limits,
      features = excluded.features;


-- ============================================================================
-- מבנה עמוד הבית
--
-- הסדר כאן הוא מה שקובע את סדר הסקציות באתר. props מכיל את
-- ההגדרות שהרכיב מקבל.
-- ============================================================================

insert into public.homepage_sections (key, type, title, subtitle, props, sort_order, is_active) values
  ('hero', 'hero', 'כל העסקים בישראל — במקום אחד',
   'אלפי בעלי מקצוע מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר.',
   '{"showSearch": true, "showCategories": true, "categoryLimit": 8}'::jsonb, 10, true),

  ('partners', 'partners', 'בשיתוף ובאישור', null,
   '{}'::jsonb, 20, true),

  ('categories', 'category_grid', 'מה אתם צריכים היום?',
   'למעלה מ-6,000 עסקים מאומתים.',
   '{"limit": 8, "wideCount": 2}'::jsonb, 30, true),

  ('featured', 'business_rail', 'עסקים מומלצים החודש',
   'נבחרו לפי דירוג, כמות ביקורות ומהירות מענה — לא לפי תשלום.',
   '{"source": "featured", "limit": 8, "layout": "rail", "emphasis": true}'::jsonb, 40, true),

  ('popular', 'business_rail', 'העסקים עם הכי הרבה ביקורות', null,
   '{"source": "reviews", "limit": 8, "layout": "grid"}'::jsonb, 50, true),

  ('stats', 'stats', 'המספרים מאחורי האינדקס', null,
   '{}'::jsonb, 60, true),

  ('business_cta', 'cta', 'הלקוחות שלכם כבר מחפשים', null,
   '{"variant": "business"}'::jsonb, 70, true),

  ('sponsored', 'business_rail', 'עסקים בקידום',
   'התוכן הזה ממומן. סימנו אותו כדי שתדעו.',
   '{"source": "sponsored", "limit": 8, "layout": "rail"}'::jsonb, 80, true),

  ('latest', 'business_rail', 'הצטרפו החודש', null,
   '{"source": "newest", "limit": 8, "layout": "rail"}'::jsonb, 90, true),

  ('testimonials', 'testimonials', 'אלפי בעלי עסקים ולקוחות כבר כאן', null,
   '{"limit": 4}'::jsonb, 100, true),

  ('blog', 'blog', 'לפני שבוחרים — כדאי לקרוא', null,
   '{"limit": 3, "leadFirst": true}'::jsonb, 110, true),

  ('faq', 'faq', 'כל מה שרציתם לדעת', null,
   '{"scope": "global"}'::jsonb, 120, true),

  ('newsletter', 'newsletter', 'העסקים הכי מומלצים, פעם בשבוע', null,
   '{}'::jsonb, 130, true)
on conflict (key) do update
  set type = excluded.type,
      title = excluded.title,
      subtitle = excluded.subtitle,
      props = excluded.props,
      sort_order = excluded.sort_order;


-- ============================================================================
-- הגדרות מערכת
-- ============================================================================

insert into public.settings (key, group_name, label, value, is_public) values
  ('brand.identity', 'מיתוג', 'זהות המותג',
   '{"name": "אינדקס", "tagline": "כל העסקים במקום אחד", "logoUrl": null}'::jsonb, true),

  ('brand.colors', 'מיתוג', 'צבעי המותג',
   '{"primary": "#0B3B75", "secondary": "#174EA6", "accent": "#FFC107", "background": "#F7F9FC"}'::jsonb, true),

  ('brand.typography', 'מיתוג', 'טיפוגרפיה',
   '{"hebrew": "Heebo", "latin": "Inter", "scale": 1}'::jsonb, true),

  ('contact.details', 'כללי', 'פרטי יצירת קשר',
   '{"phone": "", "email": "", "address": "", "whatsapp": ""}'::jsonb, true),

  ('social.links', 'כללי', 'רשתות חברתיות',
   '{"facebook": "", "instagram": "", "linkedin": "", "youtube": "", "tiktok": ""}'::jsonb, true),

  ('seo.defaults', 'SEO', 'ברירות מחדל ל-SEO',
   '{"titleTemplate": "%s | אינדקס", "defaultDescription": "", "ogImageUrl": null}'::jsonb, true),

  ('features.toggles', 'מערכת', 'מתגי מערכת',
   '{"reviewsEnabled": true, "messagingEnabled": true, "claimsEnabled": true, "newsletterEnabled": true}'::jsonb, true),

  ('moderation.rules', 'מערכת', 'כללי מודרציה',
   '{"autoApproveReviews": false, "requireBusinessApproval": true, "minReviewLength": 20}'::jsonb, false),

  ('maintenance', 'מערכת', 'מצב תחזוקה',
   '{"enabled": false, "message": "האתר בתחזוקה קצרה. נחזור בקרוב.", "allowStaff": true}'::jsonb, false)
on conflict (key) do nothing;   -- לא דורס ערכים שהמנהל כבר שינה


-- ============================================================================
-- אזורים
-- ============================================================================

insert into public.areas (slug, name, sort_order) values
  ('north',          'צפון',              10),
  ('haifa-area',     'חיפה והקריות',      20),
  ('sharon',         'השרון',             30),
  ('merkaz',         'מרכז',              40),
  ('tel-aviv-area',  'תל אביב והמרכז',    50),
  ('shfela',         'שפלה',              60),
  ('jerusalem-area', 'ירושלים והסביבה',   70),
  ('south',          'דרום',              80),
  ('eilat-area',     'אילת והערבה',       90)
on conflict (slug) do nothing;


-- ============================================================================
-- דגלי פיצ׳ר
-- ============================================================================

insert into public.feature_flags (key, label, description, is_enabled, rollout_pct) values
  ('map_search',      'חיפוש על מפה',        'תצוגת מפה בעמוד תוצאות החיפוש',      false, 0),
  ('online_booking',  'קביעת תור אונליין',   'זימון תורים ישירות מעמוד העסק',      false, 0),
  ('ai_summaries',    'תקצירי ביקורות',      'תקציר אוטומטי של ביקורות בעמוד העסק', false, 0),
  ('messaging',       'הודעות',              'צ׳אט בין גולש לבעל עסק',              true,  100),
  ('business_claims', 'בקשות בעלות',         'טעינת בעלות על עסק קיים',             true,  100)
on conflict (key) do nothing;
