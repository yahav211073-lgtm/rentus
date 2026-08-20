import type { Metadata } from "next";
import { getContactDetails } from "@/lib/repo/settings";

export const metadata: Metadata = { title: "מדיניות פרטיות", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const contact = await getContactDetails();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 font-display text-3xl text-ink-900">מדיניות פרטיות</h1>
      <div className="space-y-5 text-base leading-relaxed text-ink-600">
        <p>אנחנו אוספים רק את המידע הדרוש כדי להפעיל את השירות: פרטי חשבון, פרטי עסק שנרשמים, ופניות שאתם שולחים לעסקים.</p>
        <div>
          <h2 className="mb-2 text-ink-900">מה נשמר</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>פרטי חשבון (שם, אימייל) שנוצרים בהרשמה</li>
            <li>פרטי עסק שבעל עסק בוחר לפרסם</li>
            <li>פניות (שם, טלפון, הודעה) שגולש שולח דרך טופס יצירת קשר לעסק</li>
            <li>נתוני שימוש אנונימיים לצורך שיפור החיפוש והשירות</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-ink-900">שיתוף מידע</h2>
          <p>פרטי פנייה שאתם שולחים לעסק מועברים לאותו עסק בלבד, לצורך יצירת קשר. איננו מוכרים מידע אישי לצד שלישי.</p>
        </div>
        <div>
          <h2 className="mb-2 text-ink-900">זכויותיכם</h2>
          <p>
            אתם רשאים לבקש לעיין, לתקן או למחוק את המידע האישי שלכם
            {contact.email ? <> בפנייה למייל <a href={`mailto:${contact.email}`} className="font-bold text-brand-700 hover:text-brand-500">{contact.email}</a></> : " דרך עמוד צור הקשר"}.
          </p>
        </div>
      </div>
    </div>
  );
}
