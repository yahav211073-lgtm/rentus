import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { getBrandSettings } from "@/lib/repo/branding";
import { getAboutContent } from "@/lib/repo/settings";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return { title: "אודות", description: `מי אנחנו ולמה ${brand.name} קיים.`, alternates: { canonical: "/about" } };
}

const ICONS = [BadgeCheck, ShieldCheck, MapPin, Sparkles];

const STEPS = [
  { title: "מחפשים", body: "לפי קטגוריה, עיר או חיפוש חופשי. הסינון מצמצם לחברות שבאמת נותנות את השירות באזור שלכם." },
  { title: "משווים", body: "דירוג, ביקורות מאומתות, טווח מחירים ופרטי קשר — הכל על הכרטיס, בלי להשאיר פרטים." },
  { title: "פונים ישירות", body: "טלפון או וואטסאפ אל העסק. אנחנו לא מתווכים בשיחה ולא גובים עמלה מהעסקה." },
];

export default async function AboutPage() {
  const [brand, about] = await Promise.all([getBrandSettings(), getAboutContent()]);

  return (
    <div className="bg-ink-50 pb-20">
      {/* --- הירו --- */}
      <div className="relative isolate h-[280px] overflow-hidden sm:h-[340px]">
        <Image
          src={brand.heroImageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/92 via-brand-950/55 to-brand-950/35" />

        <div className="relative mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <h1 className="mb-3 font-display text-3xl text-white sm:text-4xl">
            אודות {brand.name}
          </h1>
          <p className="max-w-xl text-white/80">
            {brand.name} {about.intro}
          </p>
        </div>
      </div>

      {/* --- נקודות חוזק --- */}
      <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {about.points.map((point, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <div key={point.title} className="rounded-lg border border-ink-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(11,59,117,0.06)]">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-brand-800/10 text-brand-700">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h2 className="mb-1.5 text-lg text-ink-900">{point.title}</h2>
                <p className="text-sm leading-relaxed text-ink-500">{point.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- הסיפור --- */}
      <div className="bg-white py-14 sm:py-16">
        <div className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-2xs font-bold tracking-wider text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              הסיפור שלנו
            </span>
            <h2 className="mb-4 text-2xl text-ink-900 sm:text-3xl">
              התחלנו כי חיפשנו גנרטור ולא מצאנו
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-ink-600">
              <p>
                מי שצריך להשכיר ציוד בישראל מכיר את התהליך: קבוצת וואטסאפ, המלצה
                מחבר, שלוש שיחות טלפון, ואף אחד לא באמת יודע כמה זה אמור לעלות.
                הספקים הטובים קיימים — הם פשוט לא נמצאים במקום אחד, ואי אפשר
                להשוות ביניהם.
              </p>
              <p>
                {brand.name} נבנה כדי לפתור בדיוק את זה. כל חברה באינדקס עוברת
                בדיקה ידנית לפני שהיא מתפרסמת, הביקורות עוברות מודרציה, ומספר
                הטלפון מופיע על הכרטיס — בלי טפסים שחוסמים את המידע שאתם צריכים.
              </p>
              <p>
                אנחנו לא לוקחים עמלה מעסקה ולא מוכרים לידים למי שמשלם הכי הרבה.
                עסקים משלמים על נראות מסומנת בבירור, והמשתמשים לא משלמים כלום.
              </p>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={brand.heroImageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-brand-950/45 to-transparent" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* --- איך זה עובד --- */}
      <div className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6">
        <h2 className="mb-2 text-center text-2xl text-ink-900 sm:text-3xl">איך זה עובד</h2>
        <p className="mx-auto mb-8 max-w-[52ch] text-center text-base leading-relaxed text-ink-500">
          שלושה שלבים, בלי הרשמה ובלי עלות למשתמש.
        </p>

        {/* מספור אמיתי: אלה שלבים בסדר קבוע, ולכן המספר נושא מידע
            ואינו קישוט. */}
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-lg border border-ink-200/70 bg-white p-6">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mb-1.5 text-base text-ink-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* --- CTA --- */}
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-xl bg-brand-900 px-6 py-10 text-center">
          <h2 className="text-2xl text-white sm:text-3xl">יש לכם עסק להשכרה?</h2>
          <p className="max-w-[48ch] text-base leading-relaxed text-white/75">
            פרופיל בסיסי הוא חינם. הטופס נבדק ידנית ומאושר בדרך כלל תוך יום עסקים אחד.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/business/register" variant="accent" size="lg">
              הצטרפות לחברות
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              דברו איתנו
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
