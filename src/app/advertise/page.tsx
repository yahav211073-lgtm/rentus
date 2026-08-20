import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { AdRequestForm } from "@/components/ads/AdRequestForm";
import { getBrandSettings } from "@/lib/repo/branding";
import { InteriorHero } from "@/components/layout/InteriorHero";

export const metadata: Metadata = { title: "פרסום באתר", alternates: { canonical: "/advertise" } };

export default async function AdvertisePage() {
  const brand = await getBrandSettings();

  return (
    <div className="bg-ink-50 pb-20">
      <InteriorHero eyebrow="חשיפה לקהל שכבר מחפש" title={`פרסום ב-${brand.name}`} description="מיקומי פרסום ממוקדים בתוך פורטל ההשכרות — בלי לפגוע בחוויית החיפוש." compact />
      <div className="mx-auto -mt-5 max-w-2xl px-4 sm:px-6">
      <div className="relative rounded-xl border border-ink-200 bg-white p-8 text-center shadow-[0_20px_50px_-24px_rgba(11,59,117,.35)] sm:p-10">
      <Megaphone className="mx-auto mb-5 h-10 w-10 text-brand-700" />
      <p className="mb-8 text-lg leading-relaxed text-ink-600">
        באנרים ומודעות מוצגות לגולשים שכבר מחפשים בדיוק את מה שאתם מציעים —
        לצד תוצאות החיפוש ובעמוד הבית. השטח הפרסומי מנוהל ידנית, כדי לשמור על איכות הפרסום שמוצג.
      </p>
      <AdRequestForm />
      </div>
      </div>
    </div>
  );
}
