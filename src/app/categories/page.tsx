import type { Metadata } from "next";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { CategoryCarousel } from "@/components/categories/CategoryCarousel";
import { CategoryGridSearch } from "@/components/categories/CategoryGridSearch";
import { InteriorHero } from "@/components/layout/InteriorHero";

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
      <InteriorHero
        eyebrow="כל התחומים במקום אחד"
        title="מה אתם צריכים להשכיר?"
        description="דפדפו בין הקטגוריות הפעילות במערכת ומצאו חברות, ציוד ופתרונות בכל הארץ."
        action={{ label: "לחיפוש מתקדם", href: "/search" }}
        compact
      />

      <div className="mx-auto mb-16 max-w-[1100px] px-4 pt-10 sm:px-6 lg:px-8">
        <CategoryCarousel items={flat} />
      </div>

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <CategoryGridSearch items={flat} />
      </div>
    </div>
  );
}
