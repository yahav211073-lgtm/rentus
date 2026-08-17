import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Scale, Search } from "lucide-react";

const BENEFITS = [
  { Icon: MapPin, label: "אלפי חברות", sub: "בכל רחבי הארץ" },
  { Icon: Scale, label: "השוואת מחירים", sub: "חוסכים זמן וכסף" },
  { Icon: Search, label: "בקשה אחת", sub: "כמה הצעות מחיר" },
  { Icon: Heart, label: "חינם וללא התחייבות", sub: "השירות למשתמשים בחינם" },
];

/**
 * רצועת ערך: ארבע נקודות תועלת + פאנל CTA כחול, בדיוק כמו ברפרנס.
 * ה-CTA מפנה ל-/search (השוואה ופנייה לעסק ספציפי) — "בקשה אחת" כאן
 * הוא ניסוח שיווקי, לא הבטחה לפיצ'ר טכני של שליחה מרובת-ספקים
 * שלא קיים באפליקציה.
 */
export function BenefitsStrip() {
  return (
    <div className="bg-ink-50 pb-4">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-32 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm lg:grid-cols-[490px_1fr]">
          <Link
            href="/search"
            className="group flex items-center justify-between gap-4 bg-gradient-to-l from-brand-700 to-[#0754c9] px-7 py-5 transition-colors hover:from-brand-600 hover:to-brand-700"
          >
            <span>
              <span className="block text-md font-extrabold text-white">שלחו בקשה אחת</span>
              <span className="block text-xs text-white/70">וקבלו הצעות מחיר ממספר חברות</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-transform group-hover:-translate-x-1">
              לשליחת בקשה
              <ArrowLeft className="h-4 w-4" />
            </span>
          </Link>

          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-y divide-ink-100 p-3 sm:grid-cols-4 sm:divide-y-0">
            {BENEFITS.map(({ Icon, label, sub }) => (
              <div key={label} className="flex items-center justify-center gap-3 px-3 py-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-bold leading-tight text-ink-900">{label}</span>
                  <span className="text-xs text-ink-400">{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
