# Rentus — audit מובייל לפני מימוש

תאריך בדיקה: 21.08.2026  
מקורות: הקוד המקומי, render מקומי ב־Next.js, ו־`https://www.rentus.co.il/`  
יעד ראשי: `390×844`; בדיקת רוחב ראשונית בוצעה לכל ה־routes הציבוריים.

## ממצאי רוחב וניתוב

- כל 35 נתיבי ה־UI והמצבים שנבדקו ב־390px עמדו ב־`scrollWidth === innerWidth`.
- build ו־ESLint עברו לפני שינוי.
- `/business/dashboard` וכל `/admin/*` מפנים להתחברות ללא session מורשה. הקוד שלהם נבדק, אך אין לסמן QA ויזואלי מלא למסכים המוגנים בלי session מתאים.
- production והרינדור המקומי זהים בעמוד הבית בנקודת הבדיקה.

## Audit לפי route / אזור

| Route / אזור | Component | בעיית מובייל נוכחית | רפרנס דסקטופ | פתרון מובייל נדרש | חומרה |
| --- | --- | --- | --- | --- | --- |
| כל האתר | `Header`, `MobileTabBar` | הבסיס טוב וללא overflow; יש לוודא shell עקבי גם במסכי auth וניהול | גלולת ניווט מלאה ושורת utility | לשמר דסקטופ; להשאיר header קומפקטי וניווט תחתון safe-area aware | בינונית |
| כל האתר | `AccessibilityToolbar` | הכפתור הצף מכסה תוכן במסכים מרכזיים ונלחם עם CTA/סינון קבועים | בדסקטופ השטח הפנוי גדול | להקטין/למקם מחדש ולתאם מול `--spacing-bottom-inset` | גבוהה |
| כל האתר | `Footer` | הפוטר הנייד עדיין קיר קישורים ארוך; הכותרות אינן אקורדיונים בפועל | ארבע עמודות סריקות | אקורדיונים נגישים במובייל, עמודות ללא שינוי בדסקטופ | גבוהה |
| כל האתר | `PopupManager` | popup שמכיל תמונה בלבד מרנדר footer לבן ריק; modal חוסם את ה־first viewport | modal ממורכז בגודל סביר | להסיר אזור תוכן ריק ולהקשיח גאומטריית מובייל | גבוהה |
| `/` | `Hero`, `SearchBar` | ה־first viewport חזק ושימושי; נדרש לוודא 320px ושדות מגע | hero רחב עם באנרים וחיפוש בשורה | לשמר קומפוזיציה נפרדת, לחזק fallback של שורות צרות | בינונית |
| `/` | `CategoryRail`, `BenefitsStrip` | קומפקטי וטוב; rail חייב לשמור RTL/snap בכל רוחב | שורת קטגוריות מלאה | rail עם peek עקבי ו־2×2 trust grid | נמוכה |
| `/` | `GuidesSidebar`, `BusinessCarousel` | כרטיסי נתונים חלקיים נראים ריקים מדי; תוכן מסד קצר כמו “Sh” מודגש יתר על המידה | רשת כרטיסים רחבה | fallback קומפקטי שאינו ממציא מידע, ו־CTA ברור לפרופיל | בינונית |
| `/` | `ReviewsSection` | כל השכבות קיימות אך הסקשן גבוה וצפוף סביב מסך אחד | סיכום אופקי + פאנל צד | צפיפות טובה יותר במובייל, review rail וסטטיסטיקות קומפקטיות | בינונית |
| `/search` | `SearchBar`, `FilterRail` | sheet קיים, אבל מסננים פעילים אינם מוצגים כ־chips ניתנים להסרה; כפתור סינון מתחרה בכפתור הנגישות | sidebar דביק מלא | rail של active chips, sheet נגיש, תיאום שכבות קבועות | גבוהה |
| `/search` | `CompanyListCard` | פריסה אופקית טובה; רשומות חסרות metadata יוצרות שטח ריק ויעדי פעולה קטנים | כרטיס אנכי עשיר | fallback ללא נתונים מזויפים, יעד צפייה ברור, פעולות 44px כשמוצגות | בינונית |
| `/categories` | `CategoryCarousel`, `CategoryGridSearch` | ה־first viewport מכוון; יש לבדוק 320px וכיווני חצים ב־RTL | grid/קרוסלה רחבה | controls טבעיים ל־RTL ו־peek יציב ללא clip | בינונית |
| `/category/[slug]` | עמוד category | תוצאות קודמות ל־SEO וזה נכון; filter מהיר הופך לריבוי chips כשיש הרבה אזורים | hero + sidebar מדריכים | כפתור filter/אזור קומפקטי ושמירת תוכן SEO נגיש | בינונית |
| `/business/[slug]` | `BusinessGallery`, פרופיל, sticky actions | פרופיל מובייל טוב; CTA קבוע + tab bar + נגישות יוצרים שלוש שכבות מתחרות | hero, sidebar ופעולות בתוך הזרימה | לתאם bottom inset, לשמר phone/WhatsApp נגישים ולבדוק גלריה מלאה | גבוהה |
| `/blog` | כרטיסי מאמר | היררכיה ויחסי תמונה טובים; נדרשת בדיקת 320px | grid editorial | stack/rail עקבי ושמירת יחס תמונה | נמוכה |
| `/blog/[slug]` | עמוד מאמר | חוויית קריאה טובה; bottom nav וכפתור נגישות עשויים לכסות שורה בזמן קריאה | עמוד תוכן רחב | רוחב קריאה, מרווח תחתון ותמונות full-width | בינונית |
| `/about`, `/contact`, `/faq` | דפי מידע/טפסים | אין overflow; יש לוודא שלא נשאר spacing דסקטופי ארוך | hero פנימי + תוכן דו־עמודי | קצב 32–48px, טפסים בשדה אחד לשורה ואקורדיונים נגישים | בינונית |
| `/pricing`, `/advertise`, `/review` | CTA וטפסים | usable ב־390px; יש לבדוק הודעות הצלחה/שגיאה והקלדה | cards וטופס צדדי | שדות 44px+, keyboard types, CTA יחיד ברור | בינונית |
| `/login`, `/signup` | auth forms | form app-like; אין metadata ייעודי ומעטפת גלובלית ארוכה אחרי הטופס | כרטיס auth ממורכז | לשמר טופס קומפקטי, להפחית רעש משני, לבדוק שגיאה/loading | בינונית |
| `/business/register` | `RegisterBusinessForm` | hero מכוון; הטופס ארוך ודורש בדיקת keyboard/validation מלאה | hero + טופס רב שדות | sectioning ברור, שדה אחד בשורה במובייל, sticky context רק אם נחוץ | גבוהה |
| `/business/dashboard` | `OwnerBusinessCard` | הקוד נערם נכון; לא ניתן render ללא session; חסרות metrics מסכמות בדשבורד | עריכת עסק מלאה | בדיקת session אמיתי, cards/accordions ופעולות touch-first | גבוהה / חסום QA |
| `/admin` | `AdminShell`, dashboard | drawer קיים ו־metrics עוברים ל־2×2; אין render מורשה | sidebar + 4 metrics | לשמר drawer, לבדוק focus lock ו־sticky header בסשן אמיתי | גבוהה / חסום QA |
| `/admin/businesses` | טבלת עסקים | טבלת 7 עמודות נשארת טבלה מלאה ללא חלופת מובייל | טבלה מלאה שימושית | cards במובייל, טבלה בדסקטופ, tabs/search גלילים ומכילים | קריטית |
| `/admin/users` | `UsersTable` | `min-width:640px` וגלילה אופקית; זו בדיוק טבלת דסקטופ דחוסה | טבלת משתמשים מלאה | cards במובייל עם role/action; table בדסקטופ | קריטית |
| `/admin/leads` | `LeadsTable` | כבר מבוסס cards; יש לוודא שורת פעולות ו־textarea ב־320px | רשימת פניות עשירה | לשמר cards, להפוך actions ל־44px ולערום editor צר | בינונית / חסום QA |
| `/admin/reviews`, `/admin/testimonials` | moderation lists | cards קיימים בקוד; דרוש render מורשה ומצבי empty/error | רשימות moderation | פעולה ראשית/מסוכנת מופרדות, touch targets ו־feedback | גבוהה / חסום QA |
| `/admin/articles`, `/admin/categories`, `/admin/ads`, `/admin/settings` | managers/forms | grids נשברים ב־`sm`; יש לבדוק editors, uploads ו־dialogs בפועל | מסכי עריכה רב־עמודתיים | sections, bottom actions ו־dialogs אדפטיביים | גבוהה / חסום QA |
| `/403`, `not-found`, `error`, `loading` | states | 403/404 תקינים וללא overflow; loading/error אינם מכסים כל route | states ממותגים | skeletons תואמי final layout ודרך יציאה ברורה | בינונית |
| `/privacy`, `/terms`, `/accessibility`, `/review-policy` | legal content | קריא וללא overflow; הפוטר ארוך ביחס לתוכן | מסמך צר | line length, headings ומרווח תחתון מעל tab bar | נמוכה |

## עדיפות מימוש

1. תיקון popup, פוטר ושכבות fixed גלובליות.
2. מסננים פעילים ופעולות חיפוש במובייל.
3. חלופות card לטבלאות admin של עסקים ומשתמשים.
4. חיזוק כרטיסי עסק לנתונים חלקיים ויעדי מגע.
5. QA מלא ב־10 ה־viewports ודסקטופ regression.
