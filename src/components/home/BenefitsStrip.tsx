import Link from "next/link";
import { ArrowLeft, Building2, Gift, Scale, Send } from "lucide-react";

const BENEFITS = [
  { Icon: Building2, label: "עסקי השכרה", sub: "מכל רחבי הארץ" },
  { Icon: Scale, label: "משווים בקלות", sub: "בין עסקים ותחומים" },
  { Icon: Send, label: "פנייה ישירה", sub: "לעסק שמתאים לכם" },
  { Icon: Gift, label: "חיפוש פשוט", sub: "ללא עלות למשתמשים" },
];

/**
 * רצועת ערך: ארבע נקודות תועלת + פאנל CTA כחול, בדיוק כמו ברפרנס.
 * ה-CTA מפנה ל-/search (השוואה ופנייה לעסק ספציפי) ולא ל"בקשה אחת
 * לכמה חברות בו-זמנית" — הפיצ'ר הזה לא קיים בפועל באפליקציה, ואי אפשר
 * להבטיח אותו רק כי הוא מופיע ברפרנס.
 */
export function BenefitsStrip() {
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Link
            href="/search"
            className="group flex items-center justify-between gap-4 rounded-xl bg-brand-800 px-6 py-5 transition-colors hover:bg-brand-700"
          >
            <span>
              <span className="block text-md font-extrabold text-white">מצאתם מה להשכיר?</span>
              <span className="block text-xs text-white/70">עוברים לפרופיל, משווים ופונים ישירות לעסק</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-transform group-hover:-translate-x-1">
              לחיפוש עסקים
              <ArrowLeft className="h-4 w-4" />
            </span>
          </Link>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {BENEFITS.map(({ Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
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
