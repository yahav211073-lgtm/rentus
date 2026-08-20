import { Heart, MapPin, Scale, Search } from "lucide-react";
import { AdSlot } from "@/components/home/AdSlot";
import type { Banner } from "@/types/domain";

const BENEFITS = [
  { Icon: Heart,  label: "חינם וללא התחייבות", sub: "השירות למשתמשים בחינם" },
  { Icon: Search, label: "פנייה ישירה",        sub: "טלפון או וואטסאפ" },
  { Icon: Scale,  label: "השוואת מחירים",       sub: "חוסכים זמן וכסף" },
  { Icon: MapPin, label: "אלפי חברות",          sub: "בכל רחבי הארץ" },
];

/**
 * רצועת ערך קומפקטית: משבצת פרסום + ארבע נקודות תועלת.
 *
 * האייקון יושב לצד הטקסט כדי לשמור את הרצועה נמוכה ולתת לעין לסרוק
 * כל הבטחה כיחידה אחת. במובייל המודעה מוסתרת וההבטחות עוברות לשתי
 * שורות, כך שהרצועה נשארת קצרה גם במסך צר.
 *
 * במקום פאנל ה-CTA הכחול יושבת כאן משבצת פרסום. הפאנל הבטיח
 * "שלחו בקשה אחת וקבלו הצעות ממספר חברות" — פנייה דרך האתר בוטלה
 * כהחלטת מוצר (הגולש פונה ישירות בטלפון/וואטסאפ), וכותרת שמבטיחה
 * פיצ'ר שאינו קיים גרועה מהיעדרה. השטח עצמו הוא המיקום הבולט
 * ביותר בעמוד מתחת לקיפול, ולכן הוא הפך לשטח פרסומי.
 */
export function BenefitsStrip({ banner }: { banner?: Banner }) {
  return (
    <div className="bg-ink-50 pt-4">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-lg border border-ink-200/80 bg-[#f2f6fa] shadow-[0_8px_22px_-18px_rgba(5,25,47,0.38)] lg:grid-cols-[220px_minmax(0,1fr)]">

          {/* ארבע התועלות. ה-CTA מוצהר אחריהן ב-JSX ומוחזר לראש
              ב-order-first, כי עמודת ה-540px מוגדרת ראשונה ברשת —
              כלומר בצד ימין, תחילת ה-RTL, כמו בהדמיה. */}
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {BENEFITS.map(({ Icon, label, sub }, i) => (
              <div
                key={label}
                className={`flex min-h-[3.25rem] items-center gap-2 px-2.5 py-2 text-start sm:min-h-16 sm:justify-center sm:gap-2.5 sm:px-3 sm:py-2.5 lg:min-h-[84px] ${
                  /* קווי הפרדה בין הפריטים בלבד, לא בקצוות: גבול ימני
                     על כל פריט חוץ מהראשון. divide-x לא עובד כאן כי
                     הרשת מתחלפת בין שתי עמודות לארבע. */
                  i > 0 ? "border-s border-ink-100" : ""
                } ${i > 1 ? "border-t border-ink-100 sm:border-t-0" : ""}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-brand-700 shadow-sm sm:h-8 sm:w-8">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden="true" />
                </span>
                {/* הגדלים במובייל קטנים בדרגה אחת בכוונה: התווית
                    הארוכה ביותר ("חינם וללא התחייבות") נשברה לשתי
                    שורות ב-13.5px, ושורה שבורה בתא אחד מתוך ארבעה
                    שוברת את יישור הרצועה כולה. */}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-bold leading-tight text-ink-900 sm:text-sm">{label}</span>
                  <span className="text-2xs leading-tight text-ink-500 sm:text-xs">{sub}</span>
                </span>
              </div>
            ))}
          </div>

          {/* במסכים צרים המודעה מוסתרת כדי לא להכפיל את גובה הרצועה. */}
          <div className="order-first hidden bg-brand-800 lg:block">
            <AdSlot banner={banner} variant="compact" className="h-full rounded-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
