import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { CategoryRailTrack } from "@/components/home/CategoryRailTrack";

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
        <CategoryRailTrack categories={categories} />
      </div>
    </section>
  );
}
