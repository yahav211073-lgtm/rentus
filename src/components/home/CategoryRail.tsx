import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { businessCountLabel } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

/**
 * רצועת הקטגוריות שמתחת להירו.
 *
 * כרטיס אופקי לפי ההדמיה: הטקסט בצד ההתחלה (ימין ב-RTL) והתמונה
 * בצד הסיום. זו לא בחירה קוסמטית — הרצועה יושבת בדיוק מתחת לכרטיס
 * החיפוש, והעין שיוצאת ממנו סורקת שמות, לא תמונות. שם ראשון פירושו
 * שמונה שמות נקראים ברצף אחד; תמונה ראשונה מכריחה קפיצה בין
 * תמונה לשם שמונה פעמים.
 *
 * שבעה תאים: שש קטגוריות ומוצא כללי. קטגוריה בלי תמונה נופלת
 * לאייקון על רקע מותג — עדיין נקי, וגם סימן ברור למנהל איפה חסרה
 * תמונה. התמונות מגיעות מ-categories.image_url, כלומר מהאדמין.
 */
export async function CategoryRail() {
  const categories = (await getCategoriesWithCounts()).slice(0, 6);
  if (categories.length === 0) return null;

  return (
    <section className="bg-ink-50 pt-4">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        {/* במובייל רצועה נגללת עם snap; מ-lg רשת של שבע.
            [direction:ltr] על המכולה הופך את כיוון הגלילה לטבעי,
            והילדים מוחזרים ל-rtl בנפרד. */}
        <div className="flex snap-x gap-3 overflow-x-auto pb-2 [direction:ltr] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-7 lg:overflow-visible lg:pb-0">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex h-[74px] w-[158px] shrink-0 snap-start items-center gap-2 overflow-hidden rounded-lg border border-ink-200/80 bg-white p-2.5 shadow-[0_10px_26px_-18px_rgba(5,25,47,0.45)] transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_18px_34px_-18px_rgba(5,25,47,0.4)] lg:w-auto [direction:rtl]"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                {/* line-clamp ולא truncate: ברשת של שבע עמודות
                    לשם יש כ-90px, ו-"מכשירי קשר" נחתך ל-"מכשירי ק...".
                    שם קטגוריה חתוך הוא כישלון של הרצועה — כל תפקידה
                    הוא לתת לסרוק שמות. שתי שורות עדיפות על שלוש נקודות. */}
                <span className="line-clamp-2 text-xs font-bold leading-[1.3] text-ink-900 transition-colors group-hover:text-brand-700">
                  {cat.name}
                </span>
                {(cat.businessCount ?? 0) > 0 && (
                  <span className="truncate text-2xs text-ink-400">
                    {businessCountLabel(cat.businessCount ?? 0)}
                  </span>
                )}
              </span>

              {/* ריבוע ממוזער בתוך הכרטיס, לא רצועה שנוגעת בקצוות.
                  ריבוע הוא היחס היחיד שנותן לכל שש הקטגוריות להיראות
                  אחיד: התמונות במסד הן צילומים ביחסים שונים, ורצועה
                  אנכית חתכה כל אחת מהן במקום אחר. */}
              <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-md bg-ink-100">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-brand-50 text-brand-700">
                    <CategoryIcon name={cat.icon} className="h-5 w-5" />
                  </span>
                )}
              </span>
            </Link>
          ))}

          {/* "כל הקטגוריות" סוגר את הרצועה ולא פותח אותה: מתחילים
              בתוכן אמיתי, והמוצא הכללי הוא מה שחותם. */}
          <Link
            href="/categories"
            className="group flex h-[74px] w-[158px] shrink-0 snap-start items-center gap-3 rounded-lg border border-dashed border-ink-300 bg-white px-3.5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 hover:border-brand-400 hover:bg-brand-50 lg:w-auto [direction:rtl]"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
              <span className="text-xs font-bold leading-[1.3] text-ink-900">כל הקטגוריות</span>
              <span className="truncate text-2xs text-ink-400">צפו בכל הקטגוריות</span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700 transition-colors group-hover:bg-white">
              <LayoutGrid className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
