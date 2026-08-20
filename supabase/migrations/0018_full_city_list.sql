-- ============================================================================
-- 0018 — רשימת הערים המלאה (83)
--
-- עד כה היו 12 ערים בלבד בבורר, כלומר רוב הארץ פשוט לא הייתה ניתנת
-- לבחירה. כאן נכנסת הרשימה הרשמית של יישובים שמעמדם "עיר" לפי משרד
-- הפנים — 83 בדיוק, כולל אלה שהוכרזו לאחרונה (בני עי"ש, ג'סר א-זרקא,
-- מגדל שמס, עוזייר, עילוט, עין מאהל, קצרין, קריית עקרון).
--
-- שלוש נקודות שחשוב לשמור:
--
-- 1. on conflict (slug) do update — ולא insert פשוט. שתים-עשרה הערים
--    הקיימות כבר משויכות לעסקים דרך city_id; מחיקה והכנסה מחדש הייתה
--    מנתקת כל עסק מהעיר שלו. ה-slug הוא המפתח היציב, ולכן הערים
--    הקיימות מתעדכנות במקום ולא נוצרות מחדש.
--
-- 2. הסלאגים של הערים הקיימות נשמרו בדיוק כפי שהם (rishon, modiin,
--    tel-aviv ולא rishon-lezion או modiin-maccabim-reut), כדי שקישורים
--    ותוצאות חיפוש שכבר אינדקסו בגוגל לא יישברו.
--
-- 3. השיוך לאזור נעשה דרך תת-שאילתה על slug של areas ולא במזהים
--    קשיחים — המזהים נוצרים ב-gen_random_uuid ושונים בין סביבות.
-- ============================================================================

insert into public.cities (slug, name, area_id, sort_order, is_popular)
select v.slug, v.name, a.id, v.sort_order, v.is_popular
from (values
  ('umm-al-fahm', 'אום אל-פחם', 'north', 0, false),
  ('ofakim', 'אופקים', 'south', 10, false),
  ('or-yehuda', 'אור יהודה', 'tel-aviv-area', 20, false),
  ('or-akiva', 'אור עקיבא', 'sharon', 30, false),
  ('eilat', 'אילת', 'eilat-area', 40, false),
  ('elad', 'אלעד', 'merkaz', 50, false),
  ('ariel', 'אריאל', 'merkaz', 60, false),
  ('ashdod', 'אשדוד', 'south', 70, true),
  ('ashkelon', 'אשקלון', 'south', 80, false),
  ('baqa-al-gharbiyye', 'באקה אל-גרביה', 'sharon', 90, false),
  ('beer-sheva', 'באר שבע', 'south', 100, true),
  ('beit-shean', 'בית שאן', 'north', 110, false),
  ('beit-shemesh', 'בית שמש', 'jerusalem-area', 120, false),
  ('beitar-illit', 'ביתר עילית', 'jerusalem-area', 130, false),
  ('bnei-brak', 'בני ברק', 'tel-aviv-area', 140, true),
  ('bnei-ayish', 'בני עי"ש', 'shfela', 150, false),
  ('bat-yam', 'בת ים', 'tel-aviv-area', 160, false),
  ('givat-shmuel', 'גבעת שמואל', 'tel-aviv-area', 170, false),
  ('givatayim', 'גבעתיים', 'tel-aviv-area', 180, false),
  ('jisr-az-zarqa', 'ג''סר א-זרקא', 'haifa-area', 190, false),
  ('ganei-tikva', 'גני תקווה', 'tel-aviv-area', 200, false),
  ('dimona', 'דימונה', 'south', 210, false),
  ('hod-hasharon', 'הוד השרון', 'sharon', 220, false),
  ('herzliya', 'הרצליה', 'sharon', 230, false),
  ('hadera', 'חדרה', 'sharon', 240, false),
  ('holon', 'חולון', 'tel-aviv-area', 250, true),
  ('haifa', 'חיפה', 'haifa-area', 260, true),
  ('tiberias', 'טבריה', 'north', 270, false),
  ('tayibe', 'טייבה', 'sharon', 280, false),
  ('tira', 'טירה', 'sharon', 290, false),
  ('tirat-carmel', 'טירת כרמל', 'haifa-area', 300, false),
  ('tamra', 'טמרה', 'north', 310, false),
  ('yavne', 'יבנה', 'shfela', 320, false),
  ('yehud-monosson', 'יהוד-מונוסון', 'tel-aviv-area', 330, false),
  ('yokneam-illit', 'יקנעם עילית', 'north', 340, false),
  ('jerusalem', 'ירושלים', 'jerusalem-area', 350, true),
  ('kfar-yona', 'כפר יונה', 'sharon', 360, false),
  ('kfar-saba', 'כפר סבא', 'sharon', 370, false),
  ('kafr-qasim', 'כפר קאסם', 'merkaz', 380, false),
  ('kafr-qara', 'כפר קרע', 'haifa-area', 390, false),
  ('karmiel', 'כרמיאל', 'north', 400, false),
  ('lod', 'לוד', 'merkaz', 410, false),
  ('migdal-haemek', 'מגדל העמק', 'north', 420, false),
  ('majdal-shams', 'מגדל שמס', 'north', 430, false),
  ('modiin-illit', 'מודיעין עילית', 'jerusalem-area', 440, false),
  ('modiin', 'מודיעין-מכבים-רעות', 'merkaz', 450, false),
  ('maale-adumim', 'מעלה אדומים', 'jerusalem-area', 460, false),
  ('maalot-tarshiha', 'מעלות-תרשיחא', 'north', 470, false),
  ('nahariya', 'נהריה', 'north', 480, false),
  ('nof-hagalil', 'נוף הגליל', 'north', 490, false),
  ('ness-ziona', 'נס ציונה', 'shfela', 500, false),
  ('nazareth', 'נצרת', 'north', 510, false),
  ('nesher', 'נשר', 'haifa-area', 520, false),
  ('netanya', 'נתניה', 'sharon', 530, true),
  ('sakhnin', 'סחנין', 'north', 540, false),
  ('uzeir', 'עוזייר', 'north', 550, false),
  ('ilut', 'עילוט', 'north', 560, false),
  ('ein-mahil', 'עין מאהל', 'north', 570, false),
  ('akko', 'עכו', 'north', 580, false),
  ('arraba', 'עראבה', 'north', 590, false),
  ('arad', 'ערד', 'south', 600, false),
  ('petah-tikva', 'פתח תקווה', 'merkaz', 610, true),
  ('tzfat', 'צפת', 'north', 620, false),
  ('qalansawe', 'קלנסווה', 'sharon', 630, false),
  ('katzrin', 'קצרין', 'north', 640, false),
  ('kiryat-ono', 'קריית אונו', 'tel-aviv-area', 650, false),
  ('kiryat-ata', 'קריית אתא', 'haifa-area', 660, false),
  ('kiryat-bialik', 'קריית ביאליק', 'haifa-area', 670, false),
  ('kiryat-gat', 'קריית גת', 'south', 680, false),
  ('kiryat-yam', 'קריית ים', 'haifa-area', 690, false),
  ('kiryat-motzkin', 'קריית מוצקין', 'haifa-area', 700, false),
  ('kiryat-malachi', 'קריית מלאכי', 'south', 710, false),
  ('kiryat-ekron', 'קריית עקרון', 'shfela', 720, false),
  ('kiryat-shmona', 'קריית שמונה', 'north', 730, false),
  ('rosh-haayin', 'ראש העין', 'merkaz', 740, false),
  ('rishon', 'ראשון לציון', 'shfela', 750, true),
  ('rahat', 'רהט', 'south', 760, false),
  ('rehovot', 'רחובות', 'shfela', 770, true),
  ('ramla', 'רמלה', 'merkaz', 780, false),
  ('ramat-gan', 'רמת גן', 'tel-aviv-area', 790, true),
  ('ramat-hasharon', 'רמת השרון', 'sharon', 800, false),
  ('shfaram', 'שפרעם', 'north', 810, false),
  ('tel-aviv', 'תל אביב-יפו', 'tel-aviv-area', 820, true)
) as v(slug, name, area_slug, sort_order, is_popular)
left join public.areas a on a.slug = v.area_slug
on conflict (slug) do update
  set name       = excluded.name,
      area_id    = excluded.area_id,
      sort_order = excluded.sort_order,
      is_popular = excluded.is_popular,
      is_active  = true;
