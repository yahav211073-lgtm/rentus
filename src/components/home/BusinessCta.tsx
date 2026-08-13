import { BarChart3, CheckCircle2, Megaphone, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";

/**
 * קריאה לפעולה לבעלי עסקים.
 *
 * זו הסקציה שממירה — ולכן היא היחידה בעמוד שמקבלת רקע לבן נקי
 * מול הסקציות הצבעוניות סביבה, וכפתור זהב יחיד. אין כאן קישור
 * משני שמושך תשומת לב.
 */

const BENEFITS = [
  {
    Icon: Users,
    title: "פניות מלקוחות אמיתיים",
    body: "פרופיל מלא ב-Rentus מקבל בממוצע 34 פניות בחודש. כל פנייה מגיעה עם מקור ההגעה.",
  },
  {
    Icon: BarChart3,
    title: "לוח בקרה שאומר מה עובד",
    body: "כמה צפו, מאיפה הגיעו, ומה קרה עם כל פנייה. בלי לנחש ובלי גיליון אקסל.",
  },
  {
    Icon: Megaphone,
    title: "בליטה בתוצאות החיפוש",
    body: "מסלולי פרסום מציבים את העסק בראש הקטגוריה ובאזור השירות שלכם.",
  },
];

const CHECKLIST = [
  "פרופיל בסיסי ללא עלות, לתמיד",
  "אישור ידני תוך יום עסקים אחד",
  "ללא התחייבות וללא כרטיס אשראי",
];

export function BusinessCta() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <Reveal direction="start">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-accent-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              לבעלי עסקים
            </span>

            <h2 className="mb-5 font-display text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl lg:text-5xl">
              הלקוחות שלכם כבר מחפשים.
              <span className="block text-gradient">שיהיה להם את מי למצוא.</span>
            </h2>

            <p className="mb-7 max-w-xl text-md leading-relaxed text-ink-500">
              רישום העסק לוקח שבע דקות. אחריו הפרופיל שלכם מופיע בחיפושים
              הרלוונטיים, עם ביקורות, גלריה, שעות פעילות וכפתור חיוג ישיר.
            </p>

            <ul className="mb-8 space-y-2.5">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-base text-ink-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" strokeWidth={2.2} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/business/register" variant="accent" size="lg">
                רישום העסק — חינם
              </ButtonLink>
              <ButtonLink href="/pricing" variant="secondary" size="lg">
                השוואת מסלולים
              </ButtonLink>
            </div>
          </Reveal>

          <RevealStagger className="grid gap-4">
            {BENEFITS.map(({ Icon, title, body }) => (
              <RevealItem key={title}>
                <div className="group flex gap-4 rounded-lg border border-ink-200/70 bg-ink-50/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-[0_20px_44px_-18px_rgba(11,59,117,0.22)] sm:p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-brand-800 text-white transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5.5 w-5.5" strokeWidth={2.1} />
                  </span>
                  <div>
                    <h3 className="mb-1.5 text-md font-bold text-ink-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-ink-500">{body}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
