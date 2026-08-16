import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { businessCountLabel } from "@/lib/utils";
import type { Category } from "@/types/domain";

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
              className="group relative flex aspect-[16/10] w-full overflow-hidden rounded-lg border border-ink-200/70 bg-ink-200"
            >
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.imageUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
              ) : (
                <span
                  className="absolute inset-0 grid place-items-center bg-brand-800 font-display text-5xl font-extrabold text-white/25"
                  aria-hidden="true"
                >
                  {cat.name.slice(0, 1)}
                </span>
              )}

              <span className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/35 to-transparent" />

              <span className="relative mt-auto w-full p-5">
                <span className="mb-1 flex items-center gap-2">
                  <span className="font-display text-xl font-extrabold text-white">{cat.name}</span>
                  <ArrowLeft
                    className="h-4 w-4 text-white/70 transition-transform duration-200 group-hover:-translate-x-1"
                    aria-hidden="true"
                  />
                </span>

                <span className="block text-xs font-semibold text-accent-200">
                  {businessCountLabel(cat.businessCount ?? 0)}
                </span>

                {cat.children && cat.children.length > 0 && (
                  <span className="mt-1.5 block truncate text-xs text-white/65">
                    {cat.children.slice(0, 3).map((c) => c.name).join(" · ")}
                  </span>
                )}
              </span>
            </Link>
          </RevealItem>
        ))}
      </RevealStagger>
    </Section>
  );
}
