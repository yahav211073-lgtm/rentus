# דוח ביקורת אבטחה — Rentus

תאריך: 2026-08-20 · מבוקר: קוד `main` + מיגרציות `supabase/migrations/0001–0015`
שיטה: ניתוח סטטי מלא של שכבת ההרשאות (proxy, Server Actions, API routes, RLS, GRANT,
Storage policies), לא בדיקות נקודתיות.

---

## תקציר

| # | חומרה | ממצא | סטטוס |
|---|-------|------|-------|
| 1 | **קריטי** | הסלמת הרשאות: כל משתמש רשום יכול להפוך את עצמו ל-`admin` | מיגרציה `0016` נכתבה — **ממתינה להרצה מול הפרויקט החי** |
| 2 | **גבוה** | Stored XSS דרך JSON-LD בעמוד עסק (שם עסק נשלט בעלים) | **תוקן** (`jsonLd()` ב-`src/lib/utils.ts`, הוחל על 4 העמודים) |
| 3 | **בינוני** | העלאת SVG לבאקט ציבורי — סקריפט מוטבע | פתוח |
| 4 | **בינוני** | תנאי מרוץ בהגבלת הקצב (read-then-write לא אטומי) | פתוח |
| 5 | **בינוני** | `editor`/`moderator` יכולים למחוק חשבון `admin` | פתוח |
| 6 | **נמוך** | אין כותרות אבטחה כלל (CSP, HSTS, X-Frame-Options…) | פתוח |
| 7 | **נמוך** | מדיניות Storage להעלאה ישירה לא תואמת את נתיב הקבצים בפועל (מדיניות מתה) | פתוח |
| 8 | **מידע** | `npm audit --omit=dev` — 0 פגיעויות | תקין |

מה שנמצא **תקין** ובנוי היטב: RLS מופעל עם `force` על כל טבלה עם ברירת מחדל "אסור";
כל 30+ ה-Server Actions בניהול קוראות ל-`requireStaff()` ולא נשענות על ההגנה בנתיב;
`security definer` + `search_path` קבוע בכל פונקציות ההרשאה; הגבלת עמודות ב-GRANT על
`businesses` ו-`reviews`; ולידציית Zod בכל נתיב API ציבורי; שדות דבש; עוגיית מבקר
`httpOnly`+`SameSite=Lax`; לידים סגורים לקריאה ציבורית.

---

## 1. קריטי — הסלמת הרשאות מלאה מכל חשבון רשום

**קובץ:** `supabase/migrations/0009_rls.sql:48-52`

```sql
create policy profiles_update_own on public.profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
```

המדיניות מתירה למשתמש לעדכן **כל עמודה** בשורת הפרופיל שלו — כולל `role`.
בניגוד ל-`businesses` ול-`reviews`, על `profiles` **אין** `revoke update ... grant update (...)`
ברמת העמודה, ו**אין** טריגר שחוסם שינוי `role`.

ההערה ב-`0009_rls.sql:47` ("שינוי תפקיד הוא פעולת אדמין בלבד, ולעולם לא דרך עדכון עצמי")
וההערה ב-`src/app/admin/users/actions.ts:12-16` ("יש טריגר על profiles שבודק is_admin()")
מתארות הגנה שלא קיימת בפועל. `grep "create trigger"` על כל המיגרציות מחזיר טריגר
`profiles_touch` בלבד (עדכון `updated_at`).

**ניצול:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` חשוף בבנדל בתכנון. כל משתמש מחובר מריץ בקונסול:

```js
await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
```

עובר `using` ועובר `with check` (שניהם רק `id = auth.uid()`). מכאן `is_admin()` מחזיר true,
ו-`has_permission()` מחזיר true לכל הרשאה — קריאת כל הלידים של כל העסקים, מחיקת עסקים,
עריכת תוכן, מחיקת משתמשים.

**מכפיל חומרה:** לפי `CLAUDE.md`, "Confirm email" מכובה וההרשמה פתוחה לכל כתובת מייל.
כלומר לא נדרשת גישה קיימת — כל אדם באינטרנט נרשם ובתוך שתי בקשות הוא אדמין.

**תיקון:** מיגרציה חדשה שמצמצמת את ה-GRANT על `profiles` לעמודות תוכן בלבד
(`full_name, avatar_url, phone, a11y_prefs` וכו'), בתוספת טריגר `before update` שמפיל
כל שינוי ב-`role` שלא הגיע מחיבור עם `is_admin()` — חגורה ושליים, בדיוק כמו הדפוס
שכבר קיים על `businesses`.

**אימות מול ה-DB החי** (הרץ ב-Supabase SQL Editor):

```sql
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_name = 'profiles' and grantee = 'authenticated';
```

אם חוזרות כל העמודות (ולא רשימה מצומצמת) — הפרצה פעילה בפרודקשן.

---

## 2. גבוה — Stored XSS דרך JSON-LD

**קבצים:** `src/app/business/[slug]/page.tsx:773`, `src/app/category/[slug]/page.tsx:270`,
`src/app/page.tsx:218`, `src/app/blog/[slug]/page.tsx:146`

```tsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
```

`JSON.stringify` **לא** מברִיח `<` ו-`/`. ה-schema מכיל את `b.name`, `b.description`
ו-`b.tagline` — כולם ניתנים לעריכה חופשית על ידי בעל העסק דרך `updateBusiness()`
(`name` נמצא ברשימת ה-GRANT ב-`0009_rls.sql:586`).

**ניצול:** בעל עסק משנה את שם העסק ל-

```
</script><img src=x onerror="fetch('/admin/users')">
```

הסקריפט נסגר מוקדם וה-HTML שאחריו מתרנדר. זה XSS מאוחסן **על מקור האתר עצמו**,
בעמוד ציבורי — כלומר הוא רץ גם אצל מנהל שגולש לעמוד העסק, עם עוגיות הסשן שלו.
בשילוב עם היעדר CSP (ממצא 6) אין שום שכבת בלימה.

**תיקון:** פונקציית `jsonLd()` אחת שמברִיחה `<`, `>`, `&`, ` `, ` `, ומעבירה
דרכה את כל חמשת האתרים.

---

## 3. בינוני — SVG מותר להעלאה לבאקט ציבורי

**קובץ:** `src/lib/uploads.ts:5`

```ts
const ACCEPTED_IMAGE_TYPES = new Set([..., "image/svg+xml"]);
```

`ACCEPT_ATTR` (שורה 9) דווקא **לא** כולל SVG — כלומר האכיפה בשרת רחבה מהכוונה שבטופס.
SVG הוא מסמך XML שיכול להכיל `<script>`, והבאקט `business-images` ציבורי
(`0014_business_images_storage.sql:5`). כל משתמש רשום שמגיש עסק יכול להעלות SVG
שמוגש מ-`*.supabase.co` ומריץ קוד בביקור ישיר.

בנוסף: `file.type` מגיע מכותרת ה-multipart של הלקוח ואינו נבדק מול magic bytes.

**תיקון:** להוציא `image/svg+xml` מהרשימה; להוסיף בדיקת magic bytes.

---

## 4. בינוני — תנאי מרוץ בהגבלת הקצב

**קובץ:** `src/lib/rate-limit.ts:38-53`

הרצף הוא `select count` ואז `upsert count+1` — שתי פעולות נפרדות ללא אטומיות.
20 בקשות מקבילות קוראות כולן `count=0` וכותבות `count=1`. בפועל מגבלת "10 לשעה"
לא חוסמת מציף שמריץ בקשות במקביל — והיא ההגנה היחידה על טופס הלידים, ההרשמה
לניוזלטר ושער ההרשמה.

**תיקון:** פונקציית SQL אטומית עם `insert ... on conflict do update set count = count + 1
returning count`, ובדיקת המגבלה על הערך שחוזר.

---

## 5. בינוני — גבול הרשאה בין דרגות הצוות

**קובץ:** `src/app/admin/users/actions.ts:57-72`

`deleteUserAccount` דורש `requireStaff()` בלבד — כלומר `editor` או `moderator` יכולים
למחוק את חשבון ה-`admin` הראשי (החסימה היחידה היא מחיקה עצמית). באותו קובץ
`updateUserRole` דווקא כן נשען על RLS שמצמצם ל-`is_admin()`. חוסר עקביות.

**תיקון:** לדרוש `is_admin` (ולא `staff`) למחיקת חשבון, ולחסום מחיקת חשבון שהוא `admin`.

---

## 6. נמוך — אין כותרות אבטחה

`next.config.ts` לא מגדיר `headers()`, ו-`src/proxy.ts` לא מוסיף כותרות.
חסרים: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/
`frame-ancestors`, `Permissions-Policy`.

**תיקון:** בלוק `headers()` ב-`next.config.ts`. CSP יידרש nonce בגלל הסקריפט המוטבע
ב-`layout.tsx:157` — או `'unsafe-inline'` כשלב ביניים, ואז הידוק.

---

## 7. נמוך — מדיניות Storage מתה

`0014_business_images_storage.sql:19-24` מתירה העלאה כש-`(storage.foldername(name))[1] = auth.uid()`,
אבל `uploads.ts` מעלה לנתיב `owner/<uid>/...` — הסגמנט הראשון הוא הליטרל `owner`.
ההעלאות עוברות רק כי הן רצות דרך `service_role` שעוקף RLS. המדיניות לא מגינה על כלום
ולא משמשת כלום. יש ליישר: או נתיב `<uid>/...` או מדיניות שתואמת את הנתיב בפועל.

---

## סדר טיפול מוצע

1. ממצא 1 (מיגרציה + טריגר) — **מיידי**, ולפניו לוודא ב-SQL Editor שאף חשבון לא הוסלם כבר:
   `select id, email, role from public.profiles where role in ('admin','moderator','editor');`
2. ממצא 2 (jsonLd escape) — מיידי, שינוי קוד קטן.
3. ממצאים 3, 4, 5.
4. ממצאים 6, 7.
