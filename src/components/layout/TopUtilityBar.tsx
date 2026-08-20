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
        {/* הטלפון ראשון ב-DOM ולכן ראשון בקריאה — בדיוק כמו בהדמיה,
            שבה הוא הפריט הימני ביותר ברצועה. הוא גם הפעולה היחידה
            כאן שמשהו קורה בעקבותיה, ולכן הוא היחיד בלבן מלא. */}
        <div className="flex min-w-0 items-center gap-4">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-white transition-colors hover:text-accent-300"
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span dir="ltr">{phone}</span>
            </a>
          )}
          <span className="truncate">
            אתר מספר 1 בישראל להשכרת ציוד לאירועים, עבודה, תעשייה ובנייה
          </span>
          {tagline && (
            <span className="hidden truncate text-white/40 xl:inline">· {brandName} — {tagline}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <Link href="/faq" className="transition-colors hover:text-white">שאלות נפוצות</Link>
          <Link href="/about" className="transition-colors hover:text-white">מרכז העזרה</Link>
        </div>
      </div>
    </div>
  );
}
