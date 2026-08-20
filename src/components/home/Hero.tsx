import Image from "next/image";
import { BadgeCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { AdSlot } from "@/components/home/AdSlot";
import type { Banner, Category } from "@/types/domain";
import type { SimpleCity } from "@/lib/repo/taxonomy";

/**
 * ההירו של עמוד הבית.
 *
 * פס ההירו מגיע מההדמיה עם הבאנרים בצדדים: שלוש עמודות — משבצת
 * פרסום, במה כהה, משבצת פרסום. המשבצות משתמשות באותם מפתחות מיקום
 * (side_start / side_end) שהאדמין כבר מנהל, כך שבאנר שהועלה שם
 * מופיע כאן בלי הגדרה נוספת.
 *
 * כשאין באנר פעיל העמודה לא מרונדרת בכלל והבמה נמתחת על כל הרוחב.
 * מסגרת אפורה עם "מקום לפרסום" הייתה גורמת לאתר להיראות כמו תבנית
 * שלא מולאה — זו אותה החלטה שכבר מתועדת ב-AdSlot.
 *
 * אין כאן אנימציית כניסה, ולכן גם אין "use client": תוכן ההירו הוא
 * ה-LCP של העמוד. פייד-אין שמתחיל מ-opacity:0 אומר שהכותרת לא קיימת
 * עד שה-JS עולה ורץ, ובלשונית מווסתת הוא פשוט נתקע באמצע.
 */

const TRUST = [
  { Icon: BadgeCheck,  label: "אלפי חברות" },
  { Icon: ShieldCheck, label: "מחירים משתלמים" },
  { Icon: Truck,       label: "שירות בפריסה ארצית" },
  { Icon: Star,        label: "ציוד מבוטח" },
];

export function Hero({
  categories, cities, imageUrl, adStart, adEnd,
}: {
  categories: Category[];
  cities: SimpleCity[];
  imageUrl: string;
  adStart?: Banner;
  adEnd?: Banner;
}) {
  return (
    <section className="bg-ink-50 pt-4 sm:pt-5">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        {/* המשבצות נכנסות לרשת רק מ-xl. מתחת לזה אין שוליים אמיתיים,
            ודחיסת באנר 160px לצד הבמה גונבת רוחב מהתוכן העיקרי. */}
        <div className="grid gap-4 xl:grid-cols-[160px_minmax(0,1fr)_160px]">
          <AdSlot banner={adStart} className="hidden xl:block" />

          {/* ---------- הבמה ---------- */}
          <div className="relative isolate overflow-hidden rounded-lg bg-brand-950">
            <Image
              src={imageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1140px"
              className="object-cover"
            />

            {/* שתי שכבות ולא אחת: הראשונה מכהה מלמטה כדי שכרטיס
                החיפוש הלבן יישב על רקע יציב, השנייה מוסיפה הילה
                כחולה מאחורי הכותרת. גרדיאנט אחד לא עושה את שניהם
                בלי להשטיח את התמונה לגמרי. */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(to top, rgba(5,12,28,0.90) 0%, rgba(5,12,28,0.58) 40%, rgba(5,12,28,0.38) 72%, rgba(5,12,28,0.55) 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(56% 52% at 50% 32%, rgba(42,79,151,0.45), transparent 72%)",
              }}
            />

            {/* הריפוד התחתון מפנה מקום לכרטיס החיפוש הצף שמעליו.
                גובה הכרטיס במובייל הוא 108px (שורת חיפוש 44 + שני
                מסננים 40 + ריפוד), ועוד 16 מרווח מתחתיו — ולכן 136.
                פחות מזה והכרטיס מכסה את שורת נקודות האמון. */}
            <div className="relative px-4 pb-[8.5rem] pt-7 text-center xs:px-5 sm:px-10 sm:pb-32 sm:pt-16">
              <h1 className="font-display leading-[1.15] text-white drop-shadow-[0_2px_20px_rgba(5,12,28,0.7)] text-4xl lg:text-5xl">
                כל מה שצריך להשכרה,
                <br />
                {/* שורה שנייה בכחול בהיר — נקודת המבט היחידה בכותרת.
                    שני צבעים בכותרת אחת זה הגבול; שלושה זה קישוט. */}
                <span className="text-brand-300">במקום אחד.</span>
              </h1>

              {/* רשת שתי עמודות במובייל ולא flex-wrap: ה-wrap פיזר את
                  ארבעת הפריטים ל-3+1 עם רווחים לא שווים, שנקרא כתקלה.
                  שתי עמודות מיושרות = אותו מידע, גובה קבוע, ובלי שורה
                  יתומה. מ-sm חוזרים לשורה אחת כמו בדסקטופ. */}
              <ul className="mx-auto mt-4 grid max-w-[19rem] grid-cols-2 gap-x-3 gap-y-2 sm:mt-6 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-7 sm:gap-y-3">
                {TRUST.map(({ Icon, label }) => (
                  <li key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 sm:gap-2 sm:text-sm">
                    <Icon className="h-4 w-4 shrink-0 text-brand-300 sm:h-4.5 sm:w-4.5" strokeWidth={2} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* כרטיס החיפוש מרחף וחופף את שולי הבמה התחתונים — הנקודה
                שממנה העין ממשיכה ישר לרצועת הקטגוריות. */}
            <div className="absolute inset-x-3 bottom-4 xs:inset-x-4 sm:inset-x-10 sm:bottom-8 lg:inset-x-24">
              <SearchBar variant="hero" categories={categories} cities={cities} />
            </div>
          </div>

          <AdSlot banner={adEnd} className="hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
