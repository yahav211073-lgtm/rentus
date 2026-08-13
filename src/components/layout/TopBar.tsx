import Link from "next/link";
import { Phone } from "lucide-react";

/**
 * הפס העליון הכהה — כמו ברפרנס: טלפון + משפט מיצוב בצד ימין,
 * קישורי עזרה בצד שמאל. גובה נמוך (36px), טיפוגרפיה עדינה.
 *
 * רכיב שרת טהור: אין בו שום אינטראקציה, אז אין סיבה לשלוח אותו
 * כ-JavaScript ללקוח.
 */
export function TopBar({ phone, brandName }: { phone?: string | null; brandName: string }) {
  return (
    <div className="bg-brand-900 text-white">
      <div className="mx-auto flex h-9 max-w-[1480px] items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex shrink-0 items-center gap-1.5 font-bold tracking-wide transition-colors hover:text-accent-300"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <span dir="ltr">{phone}</span>
            </a>
          )}
          <p className="hidden truncate text-white/85 md:block">
            אתר מספר 1 בישראל להשכרת ציוד לאירועים, עבודה, תעשייה ובנייה
          </p>
        </div>

        <nav aria-label={`ניווט עזרה ${brandName}`} className="flex shrink-0 items-center">
          <Link href="/about" className="px-2 text-white/85 transition-colors hover:text-white">
            שאלות נפוצות
          </Link>
          <span className="h-3.5 w-px bg-white/25" aria-hidden="true" />
          <Link href="/contact" className="px-2 text-white/85 transition-colors hover:text-white">
            מרכז העזרה
          </Link>
        </nav>
      </div>
    </div>
  );
}
