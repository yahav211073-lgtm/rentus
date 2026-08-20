import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/repo/branding";

export const metadata: Metadata = { title: "תנאי שימוש", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const brand = await getBrandSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 font-display text-3xl text-ink-900">תנאי שימוש</h1>
      <div className="space-y-5 text-base leading-relaxed text-ink-600">
        <p>
          {brand.name} הוא פלטפורמת מדריך עסקים המציגה עסקים המספקים שירותי השכרה, לצורך יצירת קשר
          בין גולשים לבין בעלי עסקים. השימוש באתר כפוף לתנאים הבאים.
        </p>
        <div>
          <h2 className="mb-2 text-ink-900">אחריות</h2>
          <p>
            {brand.name} משמש כפלטפורמת חיבור בלבד. העסקאות, ההתקשרויות וההסכמות מתבצעות ישירות
            בין הגולש לבין העסק, ואיננו צד לעסקה או אחראים על טיב השירות, המחיר או האספקה.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-ink-900">תוכן ורישום עסקים</h2>
          <p>
            עסק חדש עובר בדיקה ואישור לפני פרסום. אנו שומרים לעצמנו את הזכות לסרב לפרסם, להשעות
            או להסיר עסק שאינו עומד בסטנדרטים שלנו, לרבות במקרה של תלונות מבוססות מגולשים.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-ink-900">קניין רוחני</h2>
          <p>עיצוב האתר, הלוגו והתוכן המערכתי שייכים ל-{brand.name}. תוכן שהעלה בעל עסק (תמונות, טקסטים) נשאר בבעלותו.</p>
        </div>
        <div>
          <h2 className="mb-2 text-ink-900">שינויים בתנאים</h2>
          <p>אנו רשאים לעדכן תנאים אלה מעת לעת. המשך שימוש באתר לאחר עדכון מהווה הסכמה לתנאים המעודכנים.</p>
        </div>
      </div>
    </div>
  );
}
