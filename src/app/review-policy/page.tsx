import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/repo/branding";

export const metadata: Metadata = { title: "מדיניות ביקורות", alternates: { canonical: "/review-policy" } };

export default async function ReviewPolicyPage() {
  const brand = await getBrandSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 font-display text-3xl text-ink-900">מדיניות ביקורות</h1>
      <div className="space-y-5 text-base leading-relaxed text-ink-600">
        <p>הדירוגים והביקורות ב-{brand.name} הם הבסיס לאמון בין גולשים לעסקים, ולכן אנחנו נוקטים במדיניות מודרציה ברורה.</p>
        <div>
          <h2 className="mb-2 text-ink-900">איך זה עובד</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>כל ביקורת חדשה עוברת בדיקה ידנית לפני שהיא מתפרסמת</li>
            <li>ביקורת שנראית מזויפת, פוגענית או לא רלוונטית לא תאושר</li>
            <li>בעל עסק רשאי להגיב לביקורת, אך לא לערוך או למחוק אותה</li>
            <li>עסק לא יכול לשלם כדי להסיר ביקורת שלילית אמיתית</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-ink-900">דיווח על ביקורת</h2>
          <p>אם אתם חושבים שביקורת מפרה את המדיניות הזו, ניתן לדווח עליה ואנחנו נבדוק אותה.</p>
        </div>
      </div>
    </div>
  );
}
