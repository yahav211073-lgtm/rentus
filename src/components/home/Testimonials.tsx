import { Quote } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { Rating } from "@/components/ui/Rating";
import { CoverArt } from "@/components/ui/CoverArt";
import { seedTestimonials } from "@/data/seed";

/**
 * המלצות.
 *
 * פריסת masonry קלה (עמודות CSS) ולא רשת שווה — ציטוטים באורכים
 * שונים ברשת שווה יוצרים שטח לבן מביך בתחתית הכרטיסים הקצרים.
 * columns פותר את זה בלי JavaScript.
 */
export function Testimonials() {
  return (
    <Section className="bg-white">
      <SectionHeading
        eyebrow="מה אומרים עלינו"
        title="אלפי בעלי עסקים ולקוחות כבר כאן"
        subtitle="ההמלצות האלה נאספו מבעלי עסקים ומלקוחות שהשתמשו בפלטפורמה בפועל."
        align="center"
      />

      <RevealStagger className="columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {seedTestimonials.map((t) => (
          <RevealItem key={t.id}>
            <figure className="group relative overflow-hidden rounded-lg border border-ink-200/70 bg-ink-50/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-[0_20px_44px_-16px_rgba(11,59,117,0.2)]">
              <Quote
                className="absolute h-16 w-16 text-brand-100 transition-transform duration-500 group-hover:scale-110"
                style={{ insetInlineEnd: "-8px", top: "-8px" }}
                aria-hidden="true"
              />

              {t.rating && <Rating value={t.rating} size="sm" showValue={false} className="mb-4" />}

              <blockquote className="relative mb-5 text-base leading-relaxed text-ink-700">
                {t.quote}
              </blockquote>

              <figcaption className="flex items-center gap-3">
                <CoverArt
                  seed={t.authorName}
                  label={t.authorName.charAt(0)}
                  compact
                  className="h-10 w-10 shrink-0 rounded-full"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-bold text-ink-800">{t.authorName}</span>
                  {t.authorRole && <span className="text-xs text-ink-400">{t.authorRole}</span>}
                </span>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealStagger>
    </Section>
  );
}
