import type { Metadata } from "next";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { CategoryCarousel } from "@/components/categories/CategoryCarousel";
import { CategoryGridSearch } from "@/components/categories/CategoryGridSearch";

export const metadata: Metadata = {
  title: "כל הקטגוריות",
  description: "כל תחומי ההשכרה — לפי קטגוריה ראשית ותת-קטגוריה.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  // שטוח: קטגוריות-אב ותתי-קטגוריות באותה רשימה, כדי שהחיפוש
  // והסליידר יתייחסו לכולן באותה מידה — לא רק לשלוש קטגוריות-האב.
  const flat = categories.flatMap((c) => [c, ...(c.children ?? [])]).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    imageUrl: c.imageUrl,
    businessCount: c.businessCount ?? 0,
  }));

  return (
    <div className="bg-ink-50 pb-20">
      <div className="mx-auto max-w-[1480px] px-4 pt-14 text-center sm:px-6 lg:px-8">
        <h1 className="mb-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
          מה אתם צריכים להשכיר?
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-ink-500">
          כל תחומי ההשכרה באתר, במקום אחד — דפדפו בין הקטגוריות או חפשו ישירות.
        </p>
      </div>

      <div className="mx-auto mb-16 max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <CategoryCarousel items={flat} />
      </div>

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <CategoryGridSearch items={flat} />
      </div>
    </div>
  );
}
