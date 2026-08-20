import Link from "next/link";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { businessCountLabel } from "@/lib/utils";
import type { Category } from "@/types/domain";
import { CategoryThumb } from "@/components/ui/CategoryThumb";

/**
 * רשת הקטגוריות הראשית בעמוד הבית.
 *
 * זו הסקציה שמחליפה את רשת האייקונים הגנרית. שלוש החלטות:
 *
 * · תמונה גדולה ולא אייקון — קטגוריה היא תחום, ותמונה מתארת תחום
 *   הרבה יותר טוב מקו מצויר.
 * · שכבת הכהיה קבועה מתחת לטקסט ולא רק ב-hover, כי טקסט לבן על
 *   תמונה בהירה הוא בעיית קריאות לפני שהוא בעיית עיצוב.
 * · תתי-הקטגוריות מוצגות כטקסט מתחת לכותרת ולא כקישורים נפרדים —
 *   הן עוזרות להבין מה יש בפנים בלי להפוך את הכרטיס לרשימה.
 */
export function CategoryShowcase({ categories }: { categories: Category[] }) {
  const items = categories.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <Section className="bg-ink-50">
      <SectionHeading
        eyebrow="לפי תחום"
        title="מה אתם צריכים להשכיר?"
        subtitle="כל תחום מרכז את החברות הפעילות בו, עם דירוגים ופרטי התקשרות מלאים."
        action={{ label: "לכל הקטגוריות", href: "/categories" }}
      />

      <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((cat) => (
          <RevealItem key={cat.id}>
            <Link
              href={`/category/${cat.slug}`}
              className="group relative flex min-h-60 w-full overflow-hidden rounded-xl border border-brand-800/10 bg-brand-950 p-6 shadow-[0_20px_45px_-30px_rgba(5,12,28,.7)]"
            >
              {cat.imageUrl ? (
                <CategoryThumb
                  imageUrl={cat.imageUrl}
                  name=""
                  sizes="(max-width: 768px) 50vw, 420px"
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(74,111,178,.55),transparent_34%),linear-gradient(145deg,#050c1c,#142b5c)]" />
              )}
              <span
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(5,12,28,0.92) 0%, rgba(5,12,28,0.45) 45%, rgba(5,12,28,0.15) 100%)" }}
                aria-hidden="true"
              />
              <span className="relative flex w-full flex-col justify-end">
                <span>
                <span className="mb-1 block font-display text-xl font-extrabold text-white sm:text-2xl">
                  {cat.name}
                </span>
                <span className="block text-xs font-semibold text-accent-200">
                  {businessCountLabel(cat.businessCount ?? 0)}
                </span>
                </span>
              </span>
            </Link>
          </RevealItem>
        ))}
      </RevealStagger>
    </Section>
  );
}
