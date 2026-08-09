import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { seedCategories } from "@/data/seed";
import { formatNumber } from "@/lib/utils";

/**
 * רשת קטגוריות.
 *
 * שתי הקטגוריות הראשונות תופסות שתי עמודות. זה שובר את האחידות
 * של רשת 4×2 ונותן לעין נקודת כניסה, בלי להוסיף סקציה נוספת.
 *
 * כל כרטיס נושא את צבע הקטגוריה שלו — אבל רק כרמז (רקע ב-8%
 * ואייקון). צבע מלא על שמונה כרטיסים היה הופך את הסקציה לקרנבל.
 */
export function CategoryShowcase() {
  return (
    <Section className="bg-ink-50">
      <SectionHeading
        eyebrow="קטגוריות"
        title="מה אתם צריכים היום?"
        subtitle="למעלה מ-6,000 עסקים מאומתים ב-8 תחומים ראשיים ו-40 תתי-קטגוריות."
        action={{ label: "לכל הקטגוריות", href: "/categories" }}
      />

      <RevealStagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {seedCategories.map((cat, i) => {
          const wide = i < 2;
          return (
            <RevealItem key={cat.id} className={wide ? "col-span-2" : ""}>
              <Link
                href={`/category/${cat.slug}`}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-ink-200/70 bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_24px_50px_-18px_rgba(11,59,117,0.25)] sm:p-6"
              >
                {/* שטיפת צבע שנחשפת ב-hover */}
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                  style={{ background: `linear-gradient(135deg, ${cat.accentColor}0F, transparent 65%)` }}
                  aria-hidden="true"
                />

                <div className="relative">
                  <span
                    className="mb-4 grid h-12 w-12 place-items-center rounded-[14px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                    style={{ background: `${cat.accentColor}14`, color: cat.accentColor ?? undefined }}
                  >
                    <CategoryIcon name={cat.icon} className="h-5.5 w-5.5" strokeWidth={2.1} />
                  </span>

                  <h3 className="mb-1.5 text-md font-bold text-ink-900 transition-colors group-hover:text-brand-800 sm:text-lg">
                    {cat.name}
                  </h3>

                  {wide && cat.description && (
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-ink-500">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="relative mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-400">
                    {formatNumber(cat.businessCount ?? 0)} עסקים
                  </span>
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full bg-ink-100 text-ink-400 transition-all duration-300 group-hover:bg-brand-800 group-hover:text-white"
                    aria-hidden="true"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </div>

                {/* תתי-קטגוריות בכרטיסים הרחבים */}
                {wide && cat.children && (
                  <div className="relative mt-4 flex flex-wrap gap-1.5 border-t border-ink-100 pt-4">
                    {cat.children.slice(0, 4).map((sub) => (
                      <span
                        key={sub.id}
                        className="rounded-full bg-ink-100 px-2.5 py-1 text-2xs font-medium text-ink-500 transition-colors group-hover:bg-white"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </RevealItem>
          );
        })}
      </RevealStagger>
    </Section>
  );
}
