import { getFlatCategories } from "@/lib/repo/taxonomy";
import { NewBusinessForm } from "@/components/admin/NewBusinessForm";

export const metadata = { title: "הוספת עסק", robots: { index: false, follow: false } };

/**
 * הוספת עסק ידנית — הזרימה שביקשת: פנייה מגיעה (ליד או וואטסאפ),
 * מנהל מדבר עם הלקוח בטלפון, ואז בונה לו את הפרופיל ישירות מכאן —
 * בלי לעבור דרך הרשמה עצמית. נוצר תמיד עם status='published'
 * ובלי owner_id (אין עדיין חשבון של בעל העסק).
 */
export default async function NewBusinessPage() {
  const categories = await getFlatCategories();
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink-900">הוספת עסק חדש</h1>
      <NewBusinessForm categories={categories} />
    </div>
  );
}
