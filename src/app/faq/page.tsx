import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircleQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getGlobalFaq } from "@/lib/repo/settings";
import { getBrandSettings } from "@/lib/repo/branding";
import { env } from "@/lib/env";
import { jsonLd } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: "שאלות ותשובות",
    description: `כל מה שצריך לדעת על ${brand.name} — רישום עסק, ביקורות, עלויות ותהליך הפנייה.`,
    alternates: { canonical: "/faq" },
  };
}

/**
 * שאלות ותשובות.
 *
 * התוכן מגיע מטבלת faq ונערך בניהול — לא קשיח בקוד. scope='global'
 * בלבד, כדי ששאלות ששייכות לעסק או לקטגוריה מסוימת לא ידלפו לכאן.
 *
 * <details>/<summary> ולא אקורדיון ב-JavaScript: זהו רכיב גילוי
 * מובנה בדפדפן, הוא עובד בלי JS, נגיש למקלדת ולקורא מסך בלי שורת
 * ARIA אחת, וגוגל מוצא בו את הטקסט גם כשהוא סגור. אקורדיון מותאם
 * היה מוסיף שלוש בעיות ולפתור אפס.
 *
 * ה-JSON-LD מסוג FAQPage הוא מה שמאפשר לשאלות להופיע כתוצאה
 * מורחבת בגוגל — הסיבה העיקרית שדף כזה שווה את קיומו.
 */
export default async function FaqPage() {
  const [faq, brand] = await Promise.all([getGlobalFaq(), getBrandSettings()]);

  return (
    <div className="bg-ink-50 pb-16">
      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "@id": `${env.siteUrl}/faq`,
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            }),
          }}
        />
      )}

      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
            <MessageCircleQuestion className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mb-2 text-2xl text-ink-900 sm:text-3xl">שאלות ותשובות</h1>
          <p className="mx-auto max-w-[52ch] text-base leading-relaxed text-ink-500">
            כל מה שצריך לדעת על {brand.name} — רישום עסק, ביקורות, עלויות ותהליך הפנייה.
          </p>
        </header>

        {faq.length > 0 ? (
          <div className="space-y-2.5">
            {faq.map((f, index) => (
              <details
                key={f.id}
                open={index === 0 ? true : undefined}
                className="group rounded-lg border border-ink-200/80 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(11,59,117,0.04)] transition-[border-color,box-shadow] duration-200 open:border-brand-200 open:shadow-[0_14px_30px_-24px_rgba(11,59,117,0.3)] [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-bold text-ink-900 marker:content-['']">
                  {f.question}
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500 transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 border-t border-ink-100 pt-3 text-sm leading-relaxed text-ink-600">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-ink-300 bg-white p-8 text-center text-sm text-ink-500">
            לא הצלחנו לטעון את השאלות כרגע. אפשר לנסות שוב מאוחר יותר או לפנות אלינו.
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl bg-brand-900 px-6 py-8 text-center">
          <h2 className="text-xl text-white">לא מצאתם תשובה?</h2>
          <p className="max-w-[46ch] text-sm leading-relaxed text-white/75">
            שלחו לנו הודעה ונחזור אליכם בדרך כלל תוך יום עסקים אחד.
          </p>
          <ButtonLink href="/contact" variant="accent" size="md" className="mt-1">
            לפנייה אלינו
          </ButtonLink>
        </div>

        <Link
          href="/"
          className="group mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
        >
          חזרה לעמוד הבית
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
