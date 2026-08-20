import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Scale, Search } from "lucide-react";

const BENEFITS = [
  { Icon: Heart,  label: "חינם וללא התחייבות", sub: "השירות למשתמשים בחינם" },
  { Icon: Search, label: "בקשה אחת",           sub: "כמה הצעות מחיר" },
  { Icon: Scale,  label: "השוואת מחירים",       sub: "חוסכים זמן וכסף" },
  { Icon: MapPin, label: "אלפי חברות",          sub: "בכל רחבי הארץ" },
];

/**
 * רצועת הערך: פאנל CTA כחול + ארבע נקודות תועלת.
 *
 * האייקון יושב **מעל** הטקסט וממורכז, לא לצידו. זה נראה כמו הבדל
 * קוסמטי והוא לא: ארבעה פריטים בשורה אחת עם אייקון בצד יוצרים שמונה
 * עמודות ויזואליות שהעין צריכה לפענח, ואילו אייקון-מעל-טקסט יוצר
 * ארבעה בלוקים ממורכזים שנסרקים במבט אחד. זו גם הצורה בהדמיה.
 *
 * ה-CTA מפנה ל-/search — "בקשה אחת" הוא ניסוח שיווקי של השוואה
 * ופנייה לספק, לא הבטחה לפיצ'ר שליחה מרובת-ספקים שלא קיים.
 */
export function BenefitsStrip() {
  return (
    <div className="bg-ink-50 pt-4">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-lg border border-ink-200/80 bg-white shadow-[0_10px_26px_-18px_rgba(5,25,47,0.45)] lg:grid-cols-[540px_minmax(0,1fr)]">

          {/* ארבע התועלות. ה-CTA מוצהר אחריהן ב-JSX ומוחזר לראש
              ב-order-first, כי עמודת ה-540px מוגדרת ראשונה ברשת —
              כלומר בצד ימין, תחילת ה-RTL, כמו בהדמיה. */}
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {BENEFITS.map(({ Icon, label, sub }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center justify-center gap-2 px-3 py-6 text-center ${
                  /* קווי הפרדה בין הפריטים בלבד, לא בקצוות: גבול ימני
                     על כל פריט חוץ מהראשון. divide-x לא עובד כאן כי
                     הרשת מתחלפת בין שתי עמודות לארבע. */
                  i > 0 ? "border-s border-ink-100" : ""
                } ${i > 1 ? "border-t border-ink-100 sm:border-t-0" : ""}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold leading-tight text-ink-900">{label}</span>
                  <span className="text-xs leading-tight text-ink-400">{sub}</span>
                </span>
              </div>
            ))}
          </div>

          {/* פאנל ה-CTA — יושב בעמודה הימנית. */}
          <Link
            href="/search"
            className="group order-first flex flex-col items-center justify-center gap-3 bg-brand-700 px-7 py-7 text-center transition-colors hover:bg-brand-600"
          >
            <span>
              <span className="block font-display text-xl font-extrabold text-white">שלחו בקשה אחת</span>
              <span className="mt-1 block text-sm text-white/75">וקבלו הצעות מחיר ממספר חברות</span>
            </span>
            {/* כפתור מתאר לבן ולא כפתור לבן מלא — בהדמיה הוא שקוף עם
                מסגרת, וזה גם נכון: מילוי לבן על כחול היה מושך את העין
                חזק יותר מכל כפתור אחר בעמוד, כולל הכתום שהוא הפעולה
                הראשית האמיתית של האתר. */}
            <span className="inline-flex items-center gap-2 rounded-md border-2 border-white/70 px-6 py-2.5 text-sm font-bold text-white transition-colors group-hover:border-white group-hover:bg-white group-hover:text-brand-700">
              לשליחת בקשה
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
