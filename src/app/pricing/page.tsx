import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getBrandSettings } from "@/lib/repo/branding";

export const metadata: Metadata = { title: "מסלולי פרסום", alternates: { canonical: "/pricing" } };

const PLANS = [
  {
    name: "חינם", price: "₪0", cta: "רישום חינם",
    features: ["פרופיל עסק מלא", "עד 5 תמונות", "קבלת פניות מלקוחות", "אישור תוך יום עסקים אחד"],
  },
  {
    name: "פרימיום", price: "לפי בקשה", highlight: true, cta: "דברו איתנו",
    features: ["כל מה שיש בחינם", "בליטה בראש תוצאות החיפוש", "תג \"מומלץ\"", "גלריית תמונות מורחבת", "ליווי אישי"],
  },
];

export default async function PricingPage() {
  const brand = await getBrandSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-3 font-display text-3xl font-extrabold text-ink-900">מסלולי פרסום</h1>
        <p className="text-ink-500">פרופיל בסיסי תמיד ללא עלות. מסלולים בתשלום מוסיפים בליטה בתוצאות.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col border p-7 ${plan.highlight ? "border-accent-400 bg-brand-900 text-white" : "border-ink-200/70 bg-white"}`}
          >
            <h2 className={`mb-1 font-display text-xl font-bold ${plan.highlight ? "text-white" : "text-ink-900"}`}>{plan.name}</h2>
            <p className={`mb-6 font-display text-3xl font-extrabold ${plan.highlight ? "text-accent-400" : "text-brand-800"}`}>{plan.price}</p>
            <ul className="mb-8 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-white/80" : "text-ink-600"}`}>
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-accent-400" : "text-success-500"}`} />
                  {f}
                </li>
              ))}
            </ul>
            <ButtonLink
              href={plan.highlight ? "/contact" : "/business/register"}
              variant={plan.highlight ? "accent" : "primary"}
              size="lg"
            >
              {plan.cta}
            </ButtonLink>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-ink-400">
        המחירים והמסלולים ב-{brand.name} מנוהלים ידנית ועשויים להשתנות. לפרטים מלאים דברו איתנו.
      </p>
    </div>
  );
}
