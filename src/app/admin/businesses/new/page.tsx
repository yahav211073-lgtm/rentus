import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAreas, getCities, getFlatCategories } from "@/lib/repo/taxonomy";
import { NewBusinessForm } from "@/components/admin/NewBusinessForm";

export const metadata = { title: "הוספת עסק", robots: { index: false, follow: false } };

/**
 * הוספת עסק ידנית — הזרימה שבה פנייה מגיעה (ליד או וואטסאפ), מנהל
 * מדבר עם הלקוח בטלפון, ואז בונה לו את הפרופיל ישירות מכאן, בלי
 * לעבור דרך הרשמה עצמית. נוצר תמיד עם status='published' ובלי
 * owner_id (אין עדיין חשבון של בעל העסק).
 */
export default async function NewBusinessPage() {
  const [categories, cities, areas] = await Promise.all([getFlatCategories(), getCities(), getAreas()]);

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-400 hover:text-brand-600"
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
        חזרה לרשימת העסקים
      </Link>
      <h1 className="mb-6 font-display text-2xl text-ink-900">הוספת עסק חדש</h1>
      <NewBusinessForm categories={categories} cities={cities} areas={areas} />
    </div>
  );
}
