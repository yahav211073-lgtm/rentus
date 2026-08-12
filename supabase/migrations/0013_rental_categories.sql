-- ============================================================================
-- 0013 — מעבר טקסונומיה: מאינדקס עסקים כללי למדריך השכרות (Rentus)
--
-- הקטגוריות שנזרעו ב-0010 (בריאות, יופי, משפט, נדל"ן, לימודים) שייכות
-- לתבנית "אינדקס עסקים" הגנרית שממנה הפרויקט הזה נולד — לא לקונספט
-- Rentus (השכרת ציוד לאירועים, כלים, רכב) שהוחלט עליו בפועל.
-- מוחקים אותן (cascade מטפל בילדים) ומשתמשים מחדש בשתי הקטגוריות
-- שכבר רלוונטיות (אירועים, רכב) במקום ליצור הכל מאפס.
-- ============================================================================

delete from public.categories where slug in ('briut', 'yofi', 'mishpati', 'nadlan', 'limudim');

-- "שיפוצים ובנייה" הופכת ל"כלים וציוד" — אותה שורה, שם וילדים חדשים,
-- כדי לא לאבד את ה-id אם משהו כבר מצביע עליו.
update public.categories
set name = 'כלים וציוד', description = 'כלי עבודה, ציוד בנייה והרמה, גנרטורים — הכל להשכרה'
where slug = 'shiputzim';

delete from public.categories where slug in ('kablanim', 'instalator', 'hashmalai', 'mizug');

insert into public.categories (parent_id, slug, name, sort_order)
select id, 'klei-avoda', 'כלי עבודה ומכונות', 10 from public.categories where slug = 'shiputzim'
union all
select id, 'ziud-bniya', 'ציוד בנייה והרמה', 20 from public.categories where slug = 'shiputzim'
union all
select id, 'generatorim', 'גנרטורים וחשמל', 30 from public.categories where slug = 'shiputzim';

-- אירועים: מחליפים אולמות/DJ/צילום בקטגוריות השכרה בפועל
delete from public.categories where slug in ('ulamot', 'dj', 'tzilum');

update public.categories
set name = 'קייטרינג וציוד הגשה'
where slug = 'catering';

insert into public.categories (parent_id, slug, name, sort_order)
select id, 'ohalim', 'השכרת אוהלים', 5 from public.categories where slug = 'eventim'
union all
select id, 'hagbara-teura', 'הגברה ותאורה', 15 from public.categories where slug = 'eventim'
union all
select id, 'rihut-eruim', 'ריהוט לאירועים', 25 from public.categories where slug = 'eventim';

-- רכב: מוחקים "מוסכים" (שירות תיקון, לא השכרה), משאירים השכרת רכב + גרירה
delete from public.categories where slug = 'musachim';

insert into public.categories (parent_id, slug, name, sort_order)
select id, 'negararim', 'נגררים ורכבי שטח', 40 from public.categories where slug = 'rehev';
