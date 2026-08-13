import type { Metadata } from "next";
import { BadgeCheck, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { getBrandSettings } from "@/lib/repo/branding";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return { title: "אודות", description: `מי אנחנו ולמה ${brand.name} קיים.`, alternates: { canonical: "/about" } };
}

const POINTS = [
  { Icon: BadgeCheck, title: "עסקים מאומתים", body: "כל עסק חדש עובר בדיקה ואישור ידני לפני שהוא מתפרסם — לא כל מי שנרשם עולה אוטומטית." },
  { Icon: ShieldCheck, title: "ביקורות אמיתיות בלבד", body: "ביקורות עוברות מודרציה לפני פרסום, כדי שהדירוג שאתם רואים יהיה אמין." },
  { Icon: MapPin, title: "פריסה ארצית", body: "עסקים מכל אזורי הארץ — צפון, מרכז, דרום — במקום אחד." },
  { Icon: Sparkles, title: "השוואה הוגנת", body: "עסקים מומלצים נבחרים לפי דירוג וביקורות, לא לפי מי ששילם הכי הרבה." },
];

export default async function AboutPage() {
  const brand = await getBrandSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 font-display text-3xl font-extrabold text-ink-900">אודות {brand.name}</h1>
      <p className="mb-10 text-lg leading-relaxed text-ink-600">
        {brand.name} הוא המקום שבו מוצאים כל מה שצריך להשכיר — מציוד לאירועים ועד כלי עבודה ורכב —
        דרך עסקים מאומתים בכל הארץ. במקום לחפש בעשרים קבוצות ואתרים שונים, הכל נמצא כאן, במקום אחד.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {POINTS.map(({ Icon, title, body }) => (
          <div key={title} className="border border-ink-200/70 bg-white p-5">
            <Icon className="mb-3 h-6 w-6 text-brand-700" />
            <h2 className="mb-1.5 font-bold text-ink-900">{title}</h2>
            <p className="text-sm leading-relaxed text-ink-500">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
