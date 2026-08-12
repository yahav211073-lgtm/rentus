import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
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
export async function CategoryShowcase() {
  const categories = await getCategoriesWithCounts();

  return (
    <Section className="bg-ink-50">
      <SectionHeading
        eyebrow="קטגוריות"
        title="מה אתם צריכים היום?"
        subtitle="למעלה מ-6,000 עסקים מאומתים ב-8 תחומים ראשיים ו-40 תתי-קטגוריות."
        action={{ label: "לכל הקטגוריות", href: "/categories" }}
      />

      <RevealStagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat, i) => {
          const wide = i < 2;
          return (
            <RevealItem key={cat.id} className={wide ? "col-span-2" : ""}>
              <Link
                href={`/category/${cat.slug}`}
                className="group relative flex h-full flex-col justify-between overflow-hidden border border-ink-200/70 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_24px_50px_-18px_rgba(12,29,64,0.3)] sm:p-6"
              >
                {cat.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/55 to-brand-950/20" aria-hidden="true" />
                  </>
                ) : (
                  <span
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                    style={{ background: `linear-gradient(135deg, ${cat.accentColor}0F, transparent 65%)` }}
                    aria-hidden="true"
                  />
                )}

                <div className="relative">
                  {!cat.imageUrl && (
                    <span
                      className="mb-4 grid h-12 w-12 place-items-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${cat.accentColor}14`, color: cat.accentColor ?? undefined }}
                    >
                      <CategoryIcon name={cat.icon} className="h-5.5 w-5.5" strokeWidth={2.1} />
                    </span>
                  )}

                  <h3 className={`mb-1.5 text-md font-bold sm:text-lg ${cat.imageUrl ? "text-white" : "text-ink-900 transition-colors group-hover:text-brand-800"}`}>
                    {cat.name}
                  </h3>

                  {wide && cat.description && (
                    <p className={`mb-3 line-clamp-2 text-sm leading-relaxed ${cat.imageUrl ? "text-white/80" : "text-ink-500"}`}>
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="relative mt-4 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${cat.imageUrl ? "text-white/80" : "text-ink-400"}`}>
                    {formatNumber(cat.businessCount ?? 0)} עסקים
                  </span>
                  <span
                    className={`grid h-8 w-8 place-items-center transition-all duration-300 ${
                      cat.imageUrl
                        ? "bg-white/15 text-white group-hover:bg-accent-400 group-hover:text-brand-950"
                        : "bg-ink-100 text-ink-400 group-hover:bg-brand-800 group-hover:text-white"
                    }`}
                    aria-hidden="true"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </div>

                {/* תתי-קטגוריות בכרטיסים הרחבים */}
                {wide && cat.children && cat.children.length > 0 && (
                  <div className={`relative mt-4 flex flex-wrap gap-1.5 border-t pt-4 ${cat.imageUrl ? "border-white/20" : "border-ink-100"}`}>
                    {cat.children.slice(0, 4).map((sub) => (
                      <span
                        key={sub.id}
                        className={`px-2.5 py-1 text-2xs font-medium transition-colors ${
                          cat.imageUrl ? "bg-white/15 text-white" : "bg-ink-100 text-ink-500 group-hover:bg-white"
                        }`}
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
