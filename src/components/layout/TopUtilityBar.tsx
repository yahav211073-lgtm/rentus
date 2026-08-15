import Link from "next/link";
import { Phone } from "lucide-react";

/**
 * הרצועה הכהה מעל הניווט הראשי — בדיוק כמו ברפרנס: משפט תיאורי קצר
 * וטלפון בצד ימין (בהתחלת ה-RTL), שני קישורי עזר בצד שמאל.
 */
export function TopUtilityBar({ brandName, tagline, phone }: { brandName: string; tagline: string; phone: string }) {
  return (
    <div className="hidden h-9 items-center bg-brand-950 text-white/70 sm:flex">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <span className="truncate">
            אתר מספר 1 בישראל להשכרת ציוד לאירועים, עבודה, תעשייה ובנייה — {brandName}
          </span>
          {tagline && <span className="hidden truncate text-white/40 lg:inline">· {tagline}</span>}
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <Link href="/about" className="transition-colors hover:text-white">אודות</Link>
          <Link href="/contact" className="transition-colors hover:text-white">שאלות ופניות</Link>
          {phone && (
            <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 font-semibold text-white transition-colors hover:text-accent-300">
              <Phone className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span dir="ltr">{phone}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
