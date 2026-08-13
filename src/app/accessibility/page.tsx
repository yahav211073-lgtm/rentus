import type { Metadata } from "next";
import { getContactDetails } from "@/lib/repo/settings";

export const metadata: Metadata = { title: "הצהרת נגישות", alternates: { canonical: "/accessibility" } };

export default async function AccessibilityPage() {
  const contact = await getContactDetails();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-extrabold text-ink-900">הצהרת נגישות</h1>

      <div className="space-y-5 text-base leading-relaxed text-ink-600">
        <p>
          אנחנו רואים חשיבות רבה במתן שירות שוויוני ונגיש לכלל הגולשים, כולל אנשים עם מוגבלות.
          האתר תוכנן ונבנה מתוך מטרה לעמוד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות
          (התאמות נגישות לשירות), התשע&quot;ג-2013, ותקן ישראלי ת&quot;י 5568 ברמה AA.
        </p>

        <div>
          <h2 className="mb-2 font-bold text-ink-900">מה עשינו</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>סרגל נגישות צף עם שינוי גודל גופן, מצבי ניגודיות, ומצב ידידותי לדיסלקציה</li>
            <li>ניווט מלא במקלדת עם טבעת פוקוס גלויה בכל האתר</li>
            <li>תמיכה בהקטנת אנימציות (גם דרך הסרגל וגם דרך הגדרת המערכת)</li>
            <li>טקסט חלופי לתמונות, ותגיות ARIA לרכיבים אינטראקטיביים</li>
            <li>ניגודיות צבעים העומדת בדרישות WCAG 2.2 ברמה AA</li>
          </ul>
        </div>

        <p>
          אנו ממשיכים לעבוד על שיפור הנגישות באתר באופן שוטף. אם נתקלתם בבעיית נגישות
          או שיש לכם הצעה לשיפור, נשמח שתפנו אלינו
          {contact.email ? <> במייל <a href={`mailto:${contact.email}`} className="font-bold text-brand-700 hover:text-brand-500">{contact.email}</a></> : " דרך עמוד צור הקשר"}.
        </p>
      </div>
    </div>
  );
}
