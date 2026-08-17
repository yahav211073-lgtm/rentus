import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { businessCountLabel } from "@/lib/utils";
import type { Category } from "@/types/domain";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

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
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(74,111,178,.55),transparent_34%),linear-gradient(145deg,#050c1c,#142b5c)]" />
              <span className="absolute -left-12 -top-12 h-48 w-48 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-125" />
              <span className="relative flex w-full flex-col justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-sm">
                  <CategoryIcon name={cat.icon} className="h-7 w-7" strokeWidth={1.7} />
                </span>
                <span>
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
              </span>
            </Link>
          </RevealItem>
        ))}
      </RevealStagger>
    </Section>
  );
}
