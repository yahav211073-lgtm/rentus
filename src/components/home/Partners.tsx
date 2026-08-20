import { Reveal } from "@/components/motion/Reveal";
import { seedPartners } from "@/data/seed";

/**
 * שותפים.
 *
 * הלוגואים מוצגים ב-grayscale ומתמלאים בצבע ב-hover — פרט שגורם
 * לשורה להיראות מסודרת גם כשהלוגואים מגיעים בצבעים שונים לגמרי.
 *
 * כשאין קובץ לוגו, מוצג שם הארגון בטיפוגרפיה. עדיף על ריבוע ריק.
 */
export function Partners() {
  return (
    <section className="border-y border-ink-200/60 bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-wider text-ink-400 sm:mb-8">
            בשיתוף ובאישור
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16">
            {seedPartners.map((p) => (
              <li key={p.id}>
                <span className="block text-lg font-bold text-ink-300 transition-colors duration-300 hover:text-brand-600 sm:text-xl">
                  {p.name}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
